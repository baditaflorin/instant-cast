# 0064 DRY Consolidation Map

## Status

Accepted

## Context

Import behavior is likely to sprawl as more entry points are added.

## Decision

Centralize pasted/dropped text classification in `features/state/inputRouter.ts`. Keep recording-record conversion inside `Studio.tsx` until it is reused by another production module.

## Consequences

- State JSON and share URLs are classified once.
- Avoids premature abstraction around UI-only record conversion.

## Alternatives Considered

- Extract all `Studio.tsx` helpers immediately: rejected because the right boundary is not yet proven.
