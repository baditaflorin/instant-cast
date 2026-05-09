# 0043 - Domain Vocabulary and UI Language

## Status

Accepted

## Context

Raw errors like "Failed to fetch" or "invalid version line" do not tell a recorder user what happened.

## Decision

Use recording/share vocabulary:

- "Camera was skipped" instead of "NotAllowedError".
- "Backend is unreachable" instead of "Failed to fetch".
- "The link is missing its decryption key" instead of "invalid age header".
- "Large recording: download locally or shorten it" instead of generic upload failure.

## Consequences

- Error messages become longer but actionable.
- Tests can assert the recovery class, not exact browser text.

## Alternatives Considered

- Preserve technical errors verbatim: rejected for user-facing surfaces.
