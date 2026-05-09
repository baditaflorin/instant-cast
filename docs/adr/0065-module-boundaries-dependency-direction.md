# 0065 Module Boundaries And Dependency Direction

## Status

Accepted

## Context

The frontend feature modules should stay comprehensible as import/export logic grows.

## Decision

Keep dependency direction as UI to feature helpers to lib primitives. State parsing lives in `features/state`; share URL construction/parsing lives in `features/share`; generic clipboard/download helpers stay in `lib`.

## Consequences

Feature modules do not import React unless they render UI.

## Alternatives Considered

- Put import parsing in `Studio.tsx`: rejected because multiple input pathways need the same logic.
