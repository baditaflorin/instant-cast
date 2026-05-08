package signing

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

var (
	ErrInvalidToken = errors.New("invalid token")
	ErrExpiredToken = errors.New("expired token")
)

type Claims struct {
	ID        string
	ExpiresAt time.Time
}

type Signer struct {
	secret []byte
	now    func() time.Time
}

type tokenPayload struct {
	ID  string `json:"id"`
	Exp int64  `json:"exp"`
}

func New(secret string) *Signer {
	return &Signer{
		secret: []byte(secret),
		now:    time.Now,
	}
}

func (s *Signer) Sign(id string, expiresAt time.Time) (string, error) {
	payload := tokenPayload{ID: id, Exp: expiresAt.Unix()}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("marshal token payload: %w", err)
	}

	encodedPayload := base64.RawURLEncoding.EncodeToString(payloadBytes)
	signature := s.sign(encodedPayload)
	return encodedPayload + "." + signature, nil
}

func (s *Signer) Verify(token string) (Claims, error) {
	payloadPart, signaturePart, ok := strings.Cut(token, ".")
	if !ok || payloadPart == "" || signaturePart == "" {
		return Claims{}, ErrInvalidToken
	}

	if !hmac.Equal([]byte(s.sign(payloadPart)), []byte(signaturePart)) {
		return Claims{}, ErrInvalidToken
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(payloadPart)
	if err != nil {
		return Claims{}, ErrInvalidToken
	}

	var payload tokenPayload
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return Claims{}, ErrInvalidToken
	}

	expiresAt := time.Unix(payload.Exp, 0).UTC()
	if !expiresAt.After(s.now()) {
		return Claims{}, ErrExpiredToken
	}

	return Claims{ID: payload.ID, ExpiresAt: expiresAt}, nil
}

func (s *Signer) sign(payload string) string {
	mac := hmac.New(sha256.New, s.secret)
	mac.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
