# 0040 - Real-Data Audit Findings and Substance Metrics

## Status

Accepted

## Context

The v0.1.0 app works on the clean demo path but is brittle around optional permissions, external browser stop, refresh recovery, large recordings, and hosted-share setup.

## Decision

Use the 10 fixtures in `test/fixtures/realdata/` as the Phase 2 grading rubric. The app must improve pass rate without changing deployment mode or adding unrelated features.

Success means at least 8/10 fixtures produce an actionable first result, every uncertainty carries confidence/warnings, and no hosted share starts expensive encryption before backend preflight succeeds.

## Consequences

- Tests focus on capture/share decisions, not browser permission dialogs.
- UI work is driven by real failure classes rather than decoration.
- Remaining gaps are documented in the postmortem.

## Alternatives Considered

- Only manual QA: rejected because pass-rate trend would be vague.
- Synthetic-only fixtures: rejected because the point is messy user reality.
