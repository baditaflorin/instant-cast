# 0049 - Inspectability and Debug Surface

## Status

Accepted

## Context

Support and power users need to see why the app made a capture/share decision.

## Decision

`?debug=1` shows a compact debug panel with capture mode, warnings, operation state, API endpoint, draft ID, transcript confidence, and app version/commit.

## Consequences

- Debug information is available without adding permanent chrome for normal users.
- Sensitive media bytes are never shown.

## Alternatives Considered

- Console-only debug: rejected because users cannot easily share it.
