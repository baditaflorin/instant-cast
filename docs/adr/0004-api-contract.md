# 0004 - API Contract

## Status

Accepted

## Context

Mode C requires a runtime API for encrypted blob upload and signed playback links. The frontend should not hand-roll API types.

## Decision

Publish an OpenAPI 3.1 contract at `api/openapi.yaml`. Generate frontend request types with `openapi-typescript`; the request wrapper remains small and typed.

The API exposes:

- `GET /healthz`
- `GET /readyz`
- `GET /metrics`
- `POST /api/uploads`
- `GET /api/shares/{token}`
- `GET /api/blobs/{id}`

Uploaded payloads are encrypted client-side before they reach the API.

## Consequences

- The frontend and backend share a stable contract.
- API changes require contract changes and generated type refresh.
- Share URLs can be validated without exposing storage internals.

## Alternatives Considered

- Hand-written TypeScript API client: rejected to avoid drift.
- GraphQL: unnecessary for the tiny upload/download API.
