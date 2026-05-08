# Postmortem

## What Was Built

Instant Cast v0.1.0 includes a GitHub Pages frontend, WebRTC screen/webcam recording, local Whisper transcription, FFmpeg-WASM export, MediaPipe calibration, age encryption, signed share links, a Go upload/download API, Docker deployment files, local hooks, tests, smoke checks, and docs.

Live site: https://baditaflorin.github.io/instant-cast/

Repository: https://github.com/baditaflorin/instant-cast

## Was Mode C Correct?

Yes, but narrowly. Recording, transcription, export, and encryption all fit Mode A. The only reason Mode C is justified is no-account signed sharing with upload storage and expiry. If v1 had allowed manual encrypted file sharing instead of hosted signed URLs, Mode A would have been enough.

## What Worked

- GitHub Pages was live from the first commit.
- Browser-first media work kept plaintext recordings off the backend.
- age encryption made URL-fragment key sharing straightforward.
- The backend stayed small and replaceable.

## What Did Not Work

- Publishing directly into `docs/` initially deleted ADR files during Vite builds. The build now emits into `dist/` and copies only static app files into `docs/`.
- The older Xenova transcription package had a critical audit advisory. It was replaced with `@huggingface/transformers`.
- Global local CGO flags pointed at an ONNX runtime dylib, so Go checks now run with `CGO_ENABLED=0`.

## Surprises

- Browser Whisper adds a large lazy WASM artifact even when the first-load JS budget stays below target.
- GitHub Pages can host the app cleanly, but cannot provide COOP/COEP headers needed by some faster WASM paths.

## Accepted Tech Debt

- Full media recording is not deeply automated in headless e2e because browser capture permission flows are hard to make stable.
- The backend stores encrypted blobs on local filesystem volumes rather than object storage.
- The live Pages app needs a deployed backend URL to make hosted sharing work outside local development.

## Next Improvements

1. Add S3/R2-compatible storage while keeping the same signed API contract.
2. Add trimming and caption burn-in after recording.
3. Add a cross-origin-isolated deployment option for faster WASM transcription/export.

## Time Spent Versus Estimate

Estimated: 6-8 focused hours for a production-shaped v0.1.0.

Actual: about 4 hours of implementation time in this pass, with the remaining risk concentrated in real-device media QA and backend deployment to a server.
