# 0013 - Testing Strategy

## Status

Accepted

## Context

The app combines browser media APIs, crypto, typed API calls, and a Go backend. Tests should cover pure logic heavily and smoke-test the integrated path.

## Decision

Use:

- Vitest for frontend logic unit tests.
- Playwright for frontend smoke/e2e.
- Go `testing`, `httptest`, and `testify` for backend unit and handler tests.
- `scripts/smoke.sh` to build, serve the Pages output, run Playwright, and hit backend health endpoints when available.

Target at least 70 percent coverage for backend internals and frontend logic modules.

## Consequences

- Browser-only APIs are mocked in unit tests and verified through smoke tests.
- Smoke tests stay fast enough for pre-push.
- Full media recording cannot be exhaustively tested headlessly in v1.

## Alternatives Considered

- Manual-only browser testing: rejected because regressions would be easy.
- Heavy integration suite with real browsers and sample videos only: deferred for speed.
