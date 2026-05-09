# 0063 Half-Baked Feature Triage

## Status

Accepted

## Context

Phase 3 requires finishing, hiding, or deleting incomplete UI.

## Decision

- Keep Calibrate as a real camera diagnostic that emits a concrete face/no-face result.
- Finish Import State with file, drag/drop, paste, clipboard, and multi-file routes.
- Add Print as a minimal browser output action.
- Keep API automation examples in docs only.
- Do not add sample/demo loaders.

## Consequences

Visible controls remain tied to real handlers.

## Alternatives Considered

- Hide calibration: rejected because MediaPipe is a named v1 capability and the handler now does real work.
