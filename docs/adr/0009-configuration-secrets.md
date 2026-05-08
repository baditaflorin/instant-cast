# 0009 - Configuration and Secrets Management

## Status

Accepted

## Context

The frontend cannot contain secrets. The backend needs a signing secret and filesystem paths. Local development needs clear placeholders.

## Decision

Use environment variables for all configuration. Commit `.env.example` with placeholder values only. Runtime `.env` files are gitignored.

Frontend build-time values use `VITE_*` and must be public. Backend values use `APP_*`.

Run gitleaks from the pre-commit hook.

## Consequences

- Secrets are never committed.
- The Pages build can safely expose version, commit, public API URL, repo URL, and PayPal URL.
- Deployments can rotate signing secrets outside git.

## Alternatives Considered

- Committed config files: rejected for secret risk.
- Frontend encrypted secrets: rejected because client-held secrets are not secrets.
