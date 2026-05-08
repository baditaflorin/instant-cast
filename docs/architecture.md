# Architecture

Live site: https://baditaflorin.github.io/instant-cast/

Repository: https://github.com/baditaflorin/instant-cast

## Context

```mermaid
C4Context
  title Instant Cast Context
  Person(user, "User", "Creates async demos, bug reports, and walkthroughs")
  System_Boundary(pages, "GitHub Pages") {
    System(frontend, "Instant Cast frontend", "Static React app served from docs/")
  }
  System_Boundary(host, "Docker backend host") {
    System(api, "Instant Cast API", "Anonymous encrypted blob upload and signed download")
  }
  System_Ext(paypal, "PayPal", "https://www.paypal.com/paypalme/florinbadita")
  System_Ext(github, "GitHub", "https://github.com/baditaflorin/instant-cast")
  Rel(user, frontend, "Records and plays video", "Browser")
  Rel(frontend, api, "Uploads encrypted .age blobs", "HTTPS JSON/multipart")
  Rel(frontend, github, "Links to repository")
  Rel(frontend, paypal, "Links to support")
```

## Containers

```mermaid
C4Container
  title Instant Cast Containers
  Person(user, "User")
  System_Boundary(pages, "GitHub Pages: https://baditaflorin.github.io/instant-cast/") {
    Container(app, "Frontend", "React + Vite + TypeScript", "Recorder, playback, encryption, transcription, static assets")
    ContainerDb(indexeddb, "IndexedDB", "Browser storage", "Local recording drafts and transcripts")
    Container(wasm, "Lazy WASM modules", "FFmpeg, Whisper, MediaPipe", "Loaded after user action")
  }
  System_Boundary(server, "Docker host") {
    Container(nginx, "nginx", "TLS reverse proxy", "Host port 25342")
    Container(api, "Go API", "chi + slog + Prometheus", "Signed links and encrypted blob storage")
    ContainerDb(volume, "Docker volume", "Filesystem", "Encrypted uploads only")
    Container(prom, "Prometheus", "Optional profile", "Scrapes /metrics internally")
  }
  Rel(user, app, "Uses", "HTTPS")
  Rel(app, indexeddb, "Stores drafts")
  Rel(app, wasm, "Runs media work")
  Rel(app, nginx, "Uploads/downloads encrypted blobs", "HTTPS")
  Rel(nginx, api, "Proxies", "HTTP")
  Rel(api, volume, "Reads/writes")
  Rel(prom, api, "Scrapes", "HTTP")
```

## Boundaries

- Frontend owns capture, compositing, transcription, FFmpeg export, age encryption, decryption, and playback.
- Backend owns upload limits, signed token validation, expiry, encrypted blob storage, health, readiness, and metrics.
- Backend never receives plaintext recordings or decryption keys.
- URL fragments carry age passphrases so keys are not sent to the server.
