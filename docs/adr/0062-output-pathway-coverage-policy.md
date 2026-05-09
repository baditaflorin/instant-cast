# 0062 Output Pathway Coverage Policy

## Status

Accepted

## Context

Recordings need to leave the browser as media, transcript text, encrypted share URL, or restorable state.

## Decision

Support media download, transcript copy, encrypted share links, state file download, state JSON copy, state import round-trip, and browser print. Keep API/curl examples in documentation rather than adding automation UI. Embed code, screenshots, and code export are out of scope.

## Consequences

- State JSON becomes a first-class output.
- Large state files remain download-first because base64 media can be huge.

## Alternatives Considered

- Add every possible export surface: rejected because it would create new features rather than close existing paths.
