package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/baditaflorin/instant-cast/internal/config"
	"github.com/baditaflorin/instant-cast/internal/httpapi"
	"github.com/baditaflorin/instant-cast/internal/metrics"
	"github.com/baditaflorin/instant-cast/internal/signing"
	"github.com/baditaflorin/instant-cast/internal/storage"
)

var (
	version = "0.1.0"
	commit  = "local"
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "healthcheck" {
		if err := runHealthcheck(); err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		return
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	cfg, err := config.Load(version, commit)
	if err != nil {
		logger.Error("load config", "error", err)
		os.Exit(1)
	}

	store, err := storage.New(cfg.UploadDir)
	if err != nil {
		logger.Error("create storage", "error", err)
		os.Exit(1)
	}

	api := httpapi.New(cfg, store, signing.New(cfg.SigningSecret), metrics.New(), logger)
	server := &http.Server{
		Addr:              cfg.Addr,
		Handler:           api.Router(),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       60 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	go func() {
		logger.Info("server_started", "addr", cfg.Addr, "version", cfg.Version, "commit", cfg.Commit)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server_failed", "error", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Error("server_shutdown_failed", "error", err)
		os.Exit(1)
	}

	logger.Info("server_stopped")
}

func runHealthcheck() error {
	client := http.Client{Timeout: 2 * time.Second}
	response, err := client.Get("http://127.0.0.1:8080/healthz")
	if err != nil {
		return fmt.Errorf("healthcheck request: %w", err)
	}
	defer response.Body.Close()
	_, _ = io.Copy(io.Discard, response.Body)
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("healthcheck status: %s", response.Status)
	}
	return nil
}
