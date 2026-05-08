# 0008 - Go Backend Project Layout

## Status

Accepted

## Context

The backend is small but production-facing. It needs a predictable layout for commands, internals, API contract, configs, scripts, tests, and deployment.

## Decision

Use the common Go project layout:

- `cmd/server`
- `internal/config`
- `internal/httpapi`
- `internal/storage`
- `internal/signing`
- `internal/metrics`
- `internal/utils`
- `pkg`
- `api`
- `configs`
- `scripts`
- `test`

Use chi, slog, envconfig-compatible environment names, Prometheus client, validator, and standard error wrapping.

## Consequences

- Internal packages stay private.
- The entry point stays small.
- Future commands can be added without reshaping the repo.

## Alternatives Considered

- Flat package layout: rejected because deployment, storage, and API concerns should remain separate.
