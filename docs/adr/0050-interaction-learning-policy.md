# 0050 - Interaction Learning Policy

## Status

Accepted

## Context

The app can remember harmless user corrections like camera/mic defaults, webcam corner, API endpoint, and TTL.

## Decision

Persist only local settings that do not identify a user or expose secrets. Store them in localStorage with zod validation. Do not learn transcript corrections globally; keep transcript edits in the local draft/state export only.

## Consequences

- Repeated recordings start from sensible user defaults.
- No behavioral profile leaves the browser.

## Alternatives Considered

- Server-side preferences: rejected because v1 avoids accounts.
