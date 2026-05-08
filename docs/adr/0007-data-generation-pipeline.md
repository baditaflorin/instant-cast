# 0007 - Data Generation Pipeline

## Status

Accepted

## Context

Mode C does not need a static data generation pipeline. Runtime user uploads are encrypted blobs, not precomputed public datasets.

## Decision

Do not implement a Mode B data pipeline in v1. `make data` is a documented no-op.

## Consequences

- No `docs/data/` artifact contract is needed.
- Releases do not host generated data artifacts.
- The project avoids unnecessary build complexity.

## Alternatives Considered

- Generate a static demo catalog: rejected because v1 should not imply public video discovery.
