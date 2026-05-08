# 0014 - Error Handling Conventions

## Status

Accepted

## Context

Media APIs fail often because of permissions, browser support, device availability, storage quota, or network state. Backend errors must be safe and consistent.

## Decision

Frontend errors are mapped to actionable user messages and logged only in development. Components use error boundaries and toasts.

Backend handlers return JSON errors with stable `error` and `message` fields. Internal errors are wrapped with `%w`. The `internal/utils` package includes `HandleErrorOrLogWithMessages(err, errMsg, successMsg)` for standing convention support.

Never panic for expected failures.

## Consequences

- Users see recovery paths instead of raw stack traces.
- Logs keep enough detail for operators.
- Tests can assert stable error shapes.

## Alternatives Considered

- Raw error strings from handlers: rejected because they leak internals and drift.
