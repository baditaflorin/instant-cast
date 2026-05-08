# 0001 - Deployment Mode

## Status

Accepted

## Context

Instant Cast records screen and webcam, transcribes audio locally, encrypts recordings client-side, and shares recordings through URLs. Browser APIs and WASM can handle capture, compositing, transcription, and export without a runtime server. Sharing by signed URL is different: GitHub Pages cannot receive uploads, store encrypted blobs, enforce expiry, or sign download URLs.

The default target is GitHub Pages first. A backend must be justified by runtime needs that cannot be handled statically.

## Decision

Use Mode C: GitHub Pages frontend plus a narrow Docker backend.

The frontend is the primary app and is published from `main` `/docs` at https://baditaflorin.github.io/instant-cast/. The backend only provides anonymous encrypted blob upload, signed share link validation, expiry, health/readiness, and Prometheus metrics.

The backend never receives plaintext recordings. Encryption happens in the browser before upload.

## Consequences

- GitHub Pages remains the public product surface for the app shell.
- Runtime infrastructure is limited to the sharing feature.
- The backend needs Docker, nginx, CORS, metrics, signing secrets, and operational docs.
- Local-only recording/export continues working if the sharing backend is unavailable.

## Alternatives Considered

- Mode A, pure GitHub Pages: rejected because signed sharing requires upload storage and server-side signing.
- Mode B, pre-built data: rejected because user-created recordings are runtime mutations, not static artifacts.
- IPFS-only sharing: deferred because public pinning still needs a pinning service, user setup, or backend custody.
