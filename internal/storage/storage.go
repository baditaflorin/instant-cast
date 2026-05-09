package storage

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"
)

type Metadata struct {
	Filename             string   `json:"filename" validate:"required,min=1,max=160"`
	ClearContentType     string   `json:"clearContentType" validate:"required,min=1,max=120"`
	EncryptedBytes       int64    `json:"encryptedBytes" validate:"required,min=1"`
	ClearBytes           int64    `json:"clearBytes" validate:"required,min=1"`
	Transcript           string   `json:"transcript,omitempty" validate:"max=50000"`
	TranscriptConfidence string   `json:"transcriptConfidence,omitempty" validate:"omitempty,oneof=high medium low"`
	Warnings             []string `json:"warnings,omitempty" validate:"max=50,dive,max=240"`
	CaptureMode          string   `json:"captureMode,omitempty" validate:"omitempty,oneof=screen-camera-mic screen-camera screen-mic screen-only"`
	AppVersion           string   `json:"appVersion,omitempty" validate:"max=40"`
	SchemaVersion        int      `json:"schemaVersion,omitempty" validate:"omitempty,min=1"`
	DurationSeconds      float64  `json:"durationSeconds,omitempty" validate:"min=0"`
	TTLSeconds           int64    `json:"ttlSeconds" validate:"required,min=300,max=2592000"`
}

type Record struct {
	ID        string    `json:"id"`
	ExpiresAt time.Time `json:"expiresAt"`
	Metadata  Metadata  `json:"metadata"`
}

type Store struct {
	dir string
}

func New(dir string) (*Store, error) {
	if err := os.MkdirAll(dir, 0o750); err != nil {
		return nil, fmt.Errorf("create upload dir: %w", err)
	}
	return &Store{dir: dir}, nil
}

func (s *Store) Save(ctx context.Context, reader io.Reader, metadata Metadata, expiresAt time.Time) (Record, error) {
	id, err := randomID()
	if err != nil {
		return Record{}, err
	}

	record := Record{ID: id, ExpiresAt: expiresAt.UTC(), Metadata: metadata}
	tmpPath := filepath.Join(s.dir, id+".tmp")
	blobPath := s.blobPath(id)
	metaPath := s.metaPath(id)

	tmpFile, err := os.OpenFile(tmpPath, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0o600)
	if err != nil {
		return Record{}, fmt.Errorf("create temp blob: %w", err)
	}

	if _, err := io.Copy(tmpFile, reader); err != nil {
		tmpFile.Close()
		os.Remove(tmpPath)
		return Record{}, fmt.Errorf("write blob: %w", err)
	}

	if err := tmpFile.Close(); err != nil {
		os.Remove(tmpPath)
		return Record{}, fmt.Errorf("close blob: %w", err)
	}

	select {
	case <-ctx.Done():
		os.Remove(tmpPath)
		return Record{}, ctx.Err()
	default:
	}

	if err := os.Rename(tmpPath, blobPath); err != nil {
		os.Remove(tmpPath)
		return Record{}, fmt.Errorf("commit blob: %w", err)
	}

	metaBytes, err := json.MarshalIndent(record, "", "  ")
	if err != nil {
		return Record{}, fmt.Errorf("marshal metadata: %w", err)
	}

	if err := os.WriteFile(metaPath, metaBytes, 0o600); err != nil {
		os.Remove(blobPath)
		return Record{}, fmt.Errorf("write metadata: %w", err)
	}

	return record, nil
}

func (s *Store) Get(id string) (Record, error) {
	metaBytes, err := os.ReadFile(s.metaPath(id))
	if err != nil {
		if os.IsNotExist(err) {
			return Record{}, os.ErrNotExist
		}
		return Record{}, fmt.Errorf("read metadata: %w", err)
	}

	var record Record
	if err := json.Unmarshal(metaBytes, &record); err != nil {
		return Record{}, fmt.Errorf("decode metadata: %w", err)
	}
	return record, nil
}

func (s *Store) Open(id string) (*os.File, error) {
	file, err := os.Open(s.blobPath(id))
	if err != nil {
		if os.IsNotExist(err) {
			return nil, os.ErrNotExist
		}
		return nil, fmt.Errorf("open blob: %w", err)
	}
	return file, nil
}

func (s *Store) blobPath(id string) string {
	return filepath.Join(s.dir, filepath.Base(id)+".bin")
}

func (s *Store) metaPath(id string) string {
	return filepath.Join(s.dir, filepath.Base(id)+".json")
}

func randomID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("generate id: %w", err)
	}
	return hex.EncodeToString(bytes), nil
}
