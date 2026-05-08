# 0002 - Architecture Overview and Module Boundaries

## Status

Accepted

## Context

The app needs a fast no-account recording experience, privacy-preserving local media processing, and a minimal share service. The frontend should remain useful without the backend for recording and local export.

## Decision

Use a feature-oriented frontend with these boundaries:

- `features/recorder`: screen/webcam capture, canvas compositing, MediaRecorder orchestration.
- `features/transcription`: lazy Whisper pipeline and transcript state.
- `features/media-processing`: lazy FFmpeg-WASM conversion helpers.
- `features/encryption`: Web Crypto encryption and share payload packaging.
- `features/share`: upload/download API calls and signed URL handling.
- `features/playback`: local and shared recording playback.

Use a Go backend with these boundaries:

- `cmd/server`: process entry point and graceful shutdown.
- `internal/config`: environment loading and validation.
- `internal/httpapi`: router, middleware, handlers.
- `internal/storage`: filesystem blob storage.
- `internal/signing`: signed token creation and validation.
- `internal/metrics`: Prometheus metrics.
- `internal/utils`: shared error handling helper.

## Consequences

- Core recording stays client-side and portable.
- The server can be replaced later by S3/R2 storage without disturbing the recorder.
- Feature folders keep UI, tests, and domain logic close together.

## Alternatives Considered

- Backend-served frontend: rejected because the frontend must live on GitHub Pages.
- Monolithic frontend folders by type only: rejected because the product has clear feature domains.
