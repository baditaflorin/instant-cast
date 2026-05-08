# 0017 - Dependency Policy

## Status

Accepted

## Context

The app touches media recording, WASM, crypto, API serving, and Docker deployment. Custom implementations increase risk.

## Decision

Prefer production-ready libraries with active maintenance, clear licenses, and browser/runtime compatibility.

Key dependencies:

- Frontend: React, Vite, Tailwind CSS, zod, TanStack Query, Dexie, openapi-fetch, openapi-typescript, FFmpeg-WASM, Xenova Transformers, MediaPipe Tasks Vision.
- Backend: chi, Prometheus client, validator, testify.
- Tooling: Vitest, Playwright, ESLint, Prettier, TypeScript, gitleaks.

Run `npm audit` and `govulncheck` as part of security checks when the tools are installed.

## Consequences

- The codebase avoids custom crypto, media parsers, and routing.
- Dependency updates are part of maintenance.
- Heavy WASM libraries must stay lazy-loaded.

## Alternatives Considered

- Minimal dependency approach: rejected because media and API security are specialized domains.
