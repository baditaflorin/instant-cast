package httpapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/baditaflorin/instant-cast/internal/config"
	"github.com/baditaflorin/instant-cast/internal/metrics"
	"github.com/baditaflorin/instant-cast/internal/signing"
	"github.com/baditaflorin/instant-cast/internal/storage"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-playground/validator/v10"
)

type API struct {
	cfg       config.Config
	store     *storage.Store
	signer    *signing.Signer
	metrics   *metrics.Recorder
	validator *validator.Validate
	logger    *slog.Logger
}

type healthResponse struct {
	Status  string `json:"status"`
	Version string `json:"version"`
	Commit  string `json:"commit"`
}

type uploadResponse struct {
	ID              string    `json:"id"`
	Token           string    `json:"token"`
	ExpiresAt       time.Time `json:"expiresAt"`
	BlobDownloadURL string    `json:"blobDownloadUrl"`
}

type shareResponse struct {
	ID              string           `json:"id"`
	ExpiresAt       time.Time        `json:"expiresAt"`
	BlobDownloadURL string           `json:"blobDownloadUrl"`
	Metadata        storage.Metadata `json:"metadata"`
}

type errorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

func New(
	cfg config.Config,
	store *storage.Store,
	signer *signing.Signer,
	recorder *metrics.Recorder,
	logger *slog.Logger,
) *API {
	return &API{
		cfg:       cfg,
		store:     store,
		signer:    signer,
		metrics:   recorder,
		validator: validator.New(),
		logger:    logger,
	}
}

func (a *API) Router() http.Handler {
	router := chi.NewRouter()
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Recoverer)
	router.Use(a.metrics.Middleware)
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   a.cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))
	router.Use(a.logMiddleware)

	router.Get("/healthz", a.health)
	router.Get("/readyz", a.health)
	router.Handle("/metrics", a.metrics.Handler())

	router.Route("/api", func(api chi.Router) {
		api.Post("/uploads", a.createUpload)
		api.Get("/shares/{token}", a.getShare)
		api.Get("/blobs/{id}", a.getBlob)
	})

	return router
}

func (a *API) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, healthResponse{
		Status:  "ok",
		Version: a.cfg.Version,
		Commit:  a.cfg.Commit,
	})
}

func (a *API) createUpload(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, a.cfg.MaxUploadBytes)
	if err := r.ParseMultipartForm(a.cfg.MaxUploadBytes); err != nil {
		writeError(w, http.StatusBadRequest, "bad_request", "Upload must be multipart/form-data.")
		return
	}

	var metadata storage.Metadata
	if err := json.Unmarshal([]byte(r.FormValue("metadata")), &metadata); err != nil {
		writeError(w, http.StatusBadRequest, "bad_metadata", "Metadata must be valid JSON.")
		return
	}

	if metadata.TTLSeconds == 0 {
		metadata.TTLSeconds = a.cfg.DefaultTTLSeconds
	}

	if err := a.validator.Struct(metadata); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_metadata", "Metadata failed validation.")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "missing_file", "Encrypted file is required.")
		return
	}
	defer file.Close()

	if header.Size > a.cfg.MaxUploadBytes {
		writeError(w, http.StatusRequestEntityTooLarge, "too_large", "Encrypted file is too large.")
		return
	}

	expiresAt := time.Now().UTC().Add(time.Duration(metadata.TTLSeconds) * time.Second)
	record, err := a.store.Save(r.Context(), file, metadata, expiresAt)
	if err != nil {
		a.logger.Error("save upload", "error", err)
		writeError(w, http.StatusInternalServerError, "save_failed", "Upload could not be saved.")
		return
	}

	token, err := a.signer.Sign(record.ID, record.ExpiresAt)
	if err != nil {
		a.logger.Error("sign upload", "error", err)
		writeError(w, http.StatusInternalServerError, "sign_failed", "Share link could not be signed.")
		return
	}

	a.metrics.RecordUpload(metadata.EncryptedBytes)
	writeJSON(w, http.StatusCreated, uploadResponse{
		ID:              record.ID,
		Token:           token,
		ExpiresAt:       record.ExpiresAt,
		BlobDownloadURL: a.blobURL(record.ID, token),
	})
}

func (a *API) getShare(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	claims, ok := a.verifyToken(w, token)
	if !ok {
		return
	}

	record, err := a.store.Get(claims.ID)
	if err != nil {
		status := http.StatusInternalServerError
		code := "read_failed"
		message := "Share could not be read."
		if errors.Is(err, os.ErrNotExist) {
			status = http.StatusNotFound
			code = "not_found"
			message = "Share was not found."
		}
		writeError(w, status, code, message)
		return
	}

	if !record.ExpiresAt.After(time.Now()) {
		writeError(w, http.StatusGone, "expired", "Share has expired.")
		return
	}

	writeJSON(w, http.StatusOK, shareResponse{
		ID:              record.ID,
		ExpiresAt:       record.ExpiresAt,
		BlobDownloadURL: a.blobURL(record.ID, token),
		Metadata:        record.Metadata,
	})
}

func (a *API) getBlob(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	token := r.URL.Query().Get("token")
	claims, ok := a.verifyToken(w, token)
	if !ok {
		return
	}

	if claims.ID != id {
		writeError(w, http.StatusForbidden, "wrong_blob", "Token does not grant this blob.")
		return
	}

	record, err := a.store.Get(id)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			writeError(w, http.StatusNotFound, "not_found", "Share was not found.")
			return
		}
		writeError(w, http.StatusInternalServerError, "read_failed", "Share could not be read.")
		return
	}

	if !record.ExpiresAt.After(time.Now()) {
		writeError(w, http.StatusGone, "expired", "Share has expired.")
		return
	}

	file, err := a.store.Open(id)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			writeError(w, http.StatusNotFound, "not_found", "Encrypted blob was not found.")
			return
		}
		writeError(w, http.StatusInternalServerError, "read_failed", "Encrypted blob could not be read.")
		return
	}
	defer file.Close()

	a.metrics.RecordDownload()
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", record.Metadata.Filename+".age"))
	http.ServeContent(w, r, record.Metadata.Filename+".age", record.ExpiresAt, file)
}

func (a *API) verifyToken(w http.ResponseWriter, token string) (signing.Claims, bool) {
	claims, err := a.signer.Verify(token)
	if err == nil {
		return claims, true
	}

	if errors.Is(err, signing.ErrExpiredToken) {
		writeError(w, http.StatusGone, "expired", "Share has expired.")
		return signing.Claims{}, false
	}

	writeError(w, http.StatusForbidden, "invalid_token", "Share token is invalid.")
	return signing.Claims{}, false
}

func (a *API) blobURL(id, token string) string {
	return fmt.Sprintf("%s/api/blobs/%s?token=%s", a.cfg.PublicBaseURL, url.PathEscape(id), url.QueryEscape(token))
}

func (a *API) logMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		recorder := &responseRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(recorder, r)
		a.logger.Info(
			"http_request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", recorder.status,
			"duration_ms", time.Since(started).Milliseconds(),
			"remote_addr", r.RemoteAddr,
			"request_id", middleware.GetReqID(r.Context()),
		)
	})
}

type responseRecorder struct {
	http.ResponseWriter
	status int
}

func (r *responseRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, errorResponse{Error: code, Message: message})
}
