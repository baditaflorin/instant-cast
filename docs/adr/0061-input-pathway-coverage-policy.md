# 0061 Input Pathway Coverage Policy

## Status

Accepted

## Context

Instant Cast input is mostly browser capture plus previously exported state/share links. Users expect common desktop gestures to work.

## Decision

Support file picker, drag/drop, paste-box, clipboard read, pasted share URLs, and multi-file state imports. Reject unsupported text or external URLs with actionable messages. Folder import, arbitrary website URL import, image paste, and sample/demo catalogs are out of scope.

## Consequences

- The studio gets a small input router instead of ad hoc button handlers.
- Unsupported inputs remain honest instead of silent.

## Alternatives Considered

- Add a CORS proxy for external URLs: rejected because it changes the product surface and backend risk.
