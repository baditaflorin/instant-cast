# 0048 - Determinism and Reproducibility

## Status

Accepted

## Context

Recordings and encryption contain real-time and random data, but exported app state and inference results should be reproducible.

## Decision

Non-cryptographic fixture outputs must be deterministic. Exported state includes schema version, app version, source draft ID, capture mode, transcript confidence, warnings, and generation timestamp. Random recording IDs remain random for privacy.

## Consequences

- State import/export can be tested.
- Cryptographic outputs are verified by decryption rather than byte equality.

## Alternatives Considered

- Deterministic encryption: rejected because it would harm security expectations.
