# 0046 - Performance Budgets

## Status

Accepted

## Context

Transcription, FFmpeg, encryption, and upload can take seconds or minutes.

## Decision

Operations over 300 ms surface a named step. Operations expected to exceed 5 seconds expose cancel. Size risk is estimated from duration and resolution before heavy work. The local UI remains responsive by using async steps and cancellation guards.

## Consequences

- Users can understand what is happening during long work.
- Cancellation may not stop third-party WASM immediately, but it prevents stale results from mutating state.

## Alternatives Considered

- Hide progress until a final toast: rejected because it feels stuck.
