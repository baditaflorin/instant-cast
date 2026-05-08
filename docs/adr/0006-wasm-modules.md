# 0006 - WASM Modules

## Status

Accepted

## Context

The product calls for client-side media processing and transcription. These workloads are too heavy for the initial bundle.

## Decision

Use:

- `@ffmpeg/ffmpeg` and `@ffmpeg/util` for client-side remux/export.
- `@xenova/transformers` for browser Whisper transcription.
- `@mediapipe/tasks-vision` for optional face detection and webcam framing assistance.

All modules are lazy-loaded after explicit user actions. The app avoids requiring SharedArrayBuffer by default because GitHub Pages cannot set COOP/COEP headers. If a package needs cross-origin isolation, it is kept behind a feature check and a fallback path is used.

## Consequences

- Initial page load stays small.
- Media features can fail independently with clear errors.
- Some high-performance FFmpeg/Whisper paths may be slower on GitHub Pages without COOP/COEP.

## Alternatives Considered

- Server-side FFmpeg/Whisper: rejected for v1 privacy and hosting cost.
- Custom WASM builds: rejected in favor of maintained packages.
