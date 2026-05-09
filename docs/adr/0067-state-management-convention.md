# 0067 State Management Convention

## Status

Accepted

## Context

The studio has local state, persistent drafts, settings, and transient operations.

## Decision

Use React state for current UI, IndexedDB for recording drafts, localStorage for settings, and explicit operation state for long-running work. Imported state is saved to IndexedDB before replacing visible current work.

## Consequences

Reload recovery and import behavior share the same persistence floor.

## Alternatives Considered

- Introduce a global state library: rejected as unnecessary for the current surface.
