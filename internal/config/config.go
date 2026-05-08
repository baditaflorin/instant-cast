package config

import (
	"fmt"
	"strings"
	"time"

	"github.com/kelseyhightower/envconfig"
	"github.com/spf13/viper"
)

type Config struct {
	Env               string
	Addr              string
	PublicBaseURL     string
	AllowedOrigins    []string
	UploadDir         string
	SigningSecret     string
	MaxUploadBytes    int64
	DefaultTTLSeconds int64
	Version           string
	Commit            string
}

type rawConfig struct {
	Env               string `default:"development" envconfig:"ENV"`
	Addr              string `default:":8080" envconfig:"ADDR"`
	PublicBaseURL     string `default:"http://localhost:8080" envconfig:"PUBLIC_BASE_URL"`
	AllowedOrigins    string `default:"http://localhost:5173,https://baditaflorin.github.io" envconfig:"ALLOWED_ORIGINS"`
	UploadDir         string `default:"runtime-data/uploads" envconfig:"UPLOAD_DIR"`
	SigningSecret     string `default:"dev-signing-secret-change-me-32-bytes" envconfig:"SIGNING_SECRET"`
	MaxUploadBytes    int64  `default:"524288000" envconfig:"MAX_UPLOAD_BYTES"`
	DefaultTTLSeconds int64  `default:"604800" envconfig:"DEFAULT_TTL_SECONDS"`
}

func Load(version, commit string) (Config, error) {
	viper.SetDefault("app.env", "development")
	viper.SetDefault("app.addr", ":8080")
	viper.AutomaticEnv()

	var raw rawConfig
	if err := envconfig.Process("APP", &raw); err != nil {
		return Config{}, fmt.Errorf("load env config: %w", err)
	}

	if len(raw.SigningSecret) < 32 {
		return Config{}, fmt.Errorf("APP_SIGNING_SECRET must be at least 32 bytes")
	}

	if raw.MaxUploadBytes <= 0 {
		return Config{}, fmt.Errorf("APP_MAX_UPLOAD_BYTES must be positive")
	}

	if raw.DefaultTTLSeconds < int64((5 * time.Minute).Seconds()) {
		return Config{}, fmt.Errorf("APP_DEFAULT_TTL_SECONDS must be at least 300")
	}

	return Config{
		Env:               raw.Env,
		Addr:              raw.Addr,
		PublicBaseURL:     strings.TrimRight(raw.PublicBaseURL, "/"),
		AllowedOrigins:    splitCSV(raw.AllowedOrigins),
		UploadDir:         raw.UploadDir,
		SigningSecret:     raw.SigningSecret,
		MaxUploadBytes:    raw.MaxUploadBytes,
		DefaultTTLSeconds: raw.DefaultTTLSeconds,
		Version:           version,
		Commit:            commit,
	}, nil
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
