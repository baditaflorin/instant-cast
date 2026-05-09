# 0041 - Input Robustness and Normalization Policy

## Status

Accepted

## Context

Instant Cast inputs include capture options, browser permissions, local drafts, imported state files, share URLs, backend URLs, and encrypted blobs.

## Decision

Normalize all user-entered URLs by trimming trailing slashes and validating protocol. Treat camera and microphone as optional inputs: if either fails, continue with the available screen stream and emit warnings. Validate imported state with zod before accepting it. Reject corrupted or unsupported state files without replacing current work.

## Consequences

- Optional device failure no longer aborts screen recording.
- Imported state cannot silently corrupt app state.
- Users get domain-specific recovery paths.

## Alternatives Considered

- Continue failing on any `getUserMedia` failure: rejected as too brittle.
- Accept imported JSON optimistically: rejected because it causes silent wrongness.
