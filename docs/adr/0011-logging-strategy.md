# 0011 - Logging Strategy

## Status

Accepted

## Context

Mode C needs backend logs useful for operations. The frontend should not emit noisy production console output.

## Decision

Backend logs use Go `slog` JSON to stdout with level, message, request ID, method, path, status, duration, and remote address.

Frontend production builds avoid debug logging. User-visible errors go through the toast and error boundary surfaces.

## Consequences

- Docker logs can be shipped by the host if desired.
- Frontend privacy is preserved by default.
- Debug logging can be enabled locally without changing production policy.

## Alternatives Considered

- Text backend logs: rejected because structured logs are easier to search.
- Client analytics logging: rejected for v1.
