# 0042 - Inference Engine

## Status

Accepted

## Context

Users should not configure around predictable capture and share problems. The app can infer capture viability, backend viability, size risk, restore availability, and transcript confidence.

## Decision

Add pure domain functions that infer:

- Capture mode from screen/camera/microphone availability.
- Size risk from duration and resolution.
- Share preflight class from API URL, page origin, and health endpoint.
- Transcript confidence from speech/transcript evidence.
- Draft restore action from persisted state.

These functions return confidence, warnings, and next actions.

## Consequences

- Real-data fixture tests become deterministic.
- UI status text comes from one domain vocabulary.
- Browser-specific implementation remains outside the inference engine.

## Alternatives Considered

- Inline inference in React components: rejected because it is hard to test and drifts.
