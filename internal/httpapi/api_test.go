package httpapi

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/baditaflorin/instant-cast/internal/config"
	"github.com/baditaflorin/instant-cast/internal/metrics"
	"github.com/baditaflorin/instant-cast/internal/signing"
	"github.com/baditaflorin/instant-cast/internal/storage"
	"github.com/stretchr/testify/require"
	"log/slog"
)

func TestUploadAndShare(t *testing.T) {
	dir := t.TempDir()
	store, err := storage.New(dir)
	require.NoError(t, err)

	cfg := config.Config{
		Addr:              ":0",
		PublicBaseURL:     "http://example.test",
		AllowedOrigins:    []string{"http://localhost:5173"},
		UploadDir:         dir,
		SigningSecret:     "01234567890123456789012345678901",
		MaxUploadBytes:    10 << 20,
		DefaultTTLSeconds: int64(time.Hour.Seconds()),
		Version:           "test",
		Commit:            "test",
	}

	api := New(cfg, store, signing.New(cfg.SigningSecret), metrics.New(), slog.Default())
	server := httptest.NewServer(api.Router())
	t.Cleanup(server.Close)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	metadata := storage.Metadata{
		Filename:         "demo.webm",
		ClearContentType: "video/webm",
		EncryptedBytes:   5,
		ClearBytes:       4,
		TTLSeconds:       600,
	}
	metaBytes, err := json.Marshal(metadata)
	require.NoError(t, err)
	require.NoError(t, writer.WriteField("metadata", string(metaBytes)))
	part, err := writer.CreateFormFile("file", "demo.webm.age")
	require.NoError(t, err)
	_, err = part.Write([]byte("hello"))
	require.NoError(t, err)
	require.NoError(t, writer.Close())

	req, err := http.NewRequest(http.MethodPost, server.URL+"/api/uploads", &body)
	require.NoError(t, err)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	res, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer res.Body.Close()
	require.Equal(t, http.StatusCreated, res.StatusCode)

	var uploaded uploadResponse
	require.NoError(t, json.NewDecoder(res.Body).Decode(&uploaded))
	require.NotEmpty(t, uploaded.Token)

	shareRes, err := http.Get(server.URL + "/api/shares/" + uploaded.Token)
	require.NoError(t, err)
	defer shareRes.Body.Close()
	require.Equal(t, http.StatusOK, shareRes.StatusCode)
}
