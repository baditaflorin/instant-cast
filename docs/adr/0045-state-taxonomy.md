# 0045 - State Taxonomy and State Machine

## Status

Accepted

## Context

Recording and sharing can be interrupted by browser stop, denied devices, refresh, backend errors, and cancellation.

## Decision

Use explicit recorder, operation, and share states documented in `docs/phase2-substance/states.md`. Every state must have a user-actionable exit. External browser stop resolves to auto-finalize. Hosted share failure keeps local recording intact.

## Consequences

- No stuck recording state after external stop.
- Components render intentional exits instead of relying on incidental state.

## Alternatives Considered

- Keep the existing `busyLabel` only: rejected because it cannot encode cancellation or recovery.
