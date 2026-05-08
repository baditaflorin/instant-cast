# 0010 - GitHub Pages Publishing Strategy

## Status

Accepted

## Context

The live GitHub Pages URL is a first-class deliverable from the first commit. GitHub Actions are not allowed. The built frontend must be committed.

## Decision

Publish GitHub Pages from the `main` branch `docs/` directory.

Use Vite with `base: "/instant-cast/"`. `make build` writes a complete static app to `docs/`, including `index.html`, hashed assets, `404.html`, manifest, and service worker.

Do not gitignore `docs/`. Keep `dist/` gitignored because it is only an intermediate Vite output.

Live URL: https://baditaflorin.github.io/instant-cast/

## Consequences

- Pages works without GitHub Actions.
- Every production build creates a committed static artifact.
- Local review can serve `docs/` exactly as Pages will.

## Alternatives Considered

- `gh-pages` branch: rejected because it adds branch juggling without CI.
- Publishing from root: rejected to keep source and generated site clearly separated.
