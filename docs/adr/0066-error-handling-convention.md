# 0066 Error Handling Convention

## Status

Accepted

## Context

User-facing failures should have what, why, and now-what language.

## Decision

Continue routing production UI errors through `classifyError` and `formatActionableError`. Input router failures return domain-language messages and never replace current work.

## Consequences

No new raw stack-like messages are introduced.

## Alternatives Considered

- Throw parser errors directly: rejected because corrupted state files would feel hostile.
