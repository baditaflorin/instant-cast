# 0069 Type Safety Policy At Boundaries

## Status

Accepted

## Context

Pasted text, file contents, localStorage, and API responses are untrusted.

## Decision

Validate state/settings with zod and narrow text inputs through explicit classifiers. Do not use TypeScript `any` or `@ts-ignore` in source. Unsafe casts are limited to DOM value narrowing where the option set is controlled by the UI.

## Consequences

The app refuses malformed input before mutating current work.

## Alternatives Considered

- Trust file extensions: rejected because users rename files and browsers vary.
