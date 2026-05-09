# 0068 Persistence Schema And Migration Policy

## Status

Accepted

## Context

State files and settings must survive version bumps.

## Decision

Keep explicit `schemaVersion` fields for settings and exported studio state. Defaults are applied for missing Phase 2 fields like capture mode, warnings, and transcript confidence. Breaking state changes must introduce a new schema version and migration.

## Consequences

Older drafts do not silently disappear.

## Alternatives Considered

- Best-effort JSON import without schema: rejected because it creates silent wrongness.
