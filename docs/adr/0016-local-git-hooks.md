# 0016 - Local Git Hooks

## Status

Accepted

## Context

GitHub Actions are not allowed. Quality checks need to run locally before commits and pushes.

## Decision

Use a committed `.githooks/` directory and wire it with `make install-hooks`.

Hooks:

- `pre-commit`: formatting/lint/typecheck plus gitleaks when installed.
- `commit-msg`: Conventional Commits validation.
- `pre-push`: `make test`, `make build`, and `make smoke`.
- `post-merge` and `post-checkout`: regenerate generated API types when dependencies exist.

## Consequences

- Contributors opt in with one command.
- Hooks remain inspectable shell scripts.
- Missing optional tools print clear installation messages.

## Alternatives Considered

- Lefthook: viable, but plain hooks avoid another dependency.
