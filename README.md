# Instant Cast

![Pages](https://img.shields.io/badge/pages-live-0a6b6f)
![License](https://img.shields.io/badge/license-MIT-d95f43)
![Mode](https://img.shields.io/badge/deploy-Mode%20C-426b45)

Live site: https://baditaflorin.github.io/instant-cast/

Repository: https://github.com/baditaflorin/instant-cast

Support: https://www.paypal.com/paypalme/florinbadita

Instant Cast is a no-account screen recorder with webcam overlay, on-device transcription, age encryption, and signed expiring share links.

![Instant Cast screenshot](docs/screenshot.png)

## Quickstart

```sh
npm install
make install-hooks
make dev
```

## What Works

- Screen recording with webcam overlay through WebRTC browser APIs.
- Local transcript generation through lazy-loaded Whisper in `@huggingface/transformers`.
- Client-side `.age` encryption before uploads using `age-encryption`.
- Signed anonymous upload/download API in Go; plaintext recordings never reach the backend.
- GitHub Pages build in `docs/`, with version and commit visible in the UI.

## Architecture

```mermaid
C4Context
  title Instant Cast Context
  Person(user, "User", "Records, transcribes, encrypts, and shares a cast")
  System_Boundary(pages, "GitHub Pages") {
    System(frontend, "Instant Cast frontend", "React, TypeScript, WASM, IndexedDB")
  }
  System_Boundary(server, "Docker host") {
    System(api, "Instant Cast API", "Go, signed URLs, encrypted blob storage")
  }
  System_Ext(repo, "GitHub repository", "https://github.com/baditaflorin/instant-cast")
  Rel(user, frontend, "Uses", "HTTPS")
  Rel(frontend, api, "Uploads/downloads encrypted blobs", "HTTPS")
  Rel(frontend, repo, "Links to star")
```

Architecture docs: docs/architecture.md

ADRs: docs/adr/

Backend deploy guide: deploy/README.md

## Development

```sh
make help
make test
make build
make smoke
```

## Release

```sh
make docker-push
make release
```
