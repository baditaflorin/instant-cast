# 0047 - Error Taxonomy and Messaging Guidelines

## Status

Accepted

## Context

Failure modes span browser permissions, storage, backend reachability, upload limits, corrupted state, missing share keys, and decryption mismatch.

## Decision

Every user-facing error must include: what failed, why in domain terms, and now what. Recoverable errors preserve current work. Fatal errors are limited to unsupported browser primitives or unusable persisted data.

## Consequences

- Error strings are audited as product behavior.
- Catch blocks map unknown technical errors into recovery classes.

## Alternatives Considered

- Surface exception messages directly: rejected for privacy and clarity.
