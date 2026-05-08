# 0003 - Frontend Framework and Build Tooling

## Status

Accepted

## Context

The app needs rich capture controls, local media state, workers, WASM modules, and a build output compatible with GitHub Pages.

## Decision

Use React, TypeScript strict mode, Vite, Tailwind CSS, Vitest, Playwright, zod, TanStack Query, and Comlink where worker boundaries need RPC ergonomics.

Build output is committed to `docs/`. The Vite base path is `/instant-cast/`.

## Consequences

- React keeps the UI component model familiar and mature.
- Vite gives fast local development and a static build suitable for Pages.
- TypeScript strict mode catches media-state mistakes early.
- Large WASM packages are lazy-loaded after user action.

## Alternatives Considered

- SvelteKit static adapter: viable, but React has broader library examples for media/WASM workflows.
- Vanilla TypeScript: possible, but state and error boundaries would be more custom code.
