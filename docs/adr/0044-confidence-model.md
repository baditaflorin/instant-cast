# 0044 - Confidence Model

## Status

Accepted

## Context

Transcripts and capture/share inferences can be wrong. v0.1.0 presented results without confidence.

## Decision

Use a three-level confidence model: `high`, `medium`, `low`. Confidence appears in transcript metadata, share metadata, exported state, and debug output. Low-confidence transcript results include "Review transcript" warnings.

## Consequences

- The app avoids silent wrongness.
- Future model confidence can replace heuristics without changing exported shape.

## Alternatives Considered

- Numeric percentages: deferred because current sources are heuristic.
