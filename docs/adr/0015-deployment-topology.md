# 0015 - Deployment Topology

## Status

Accepted

## Context

Mode C requires a static frontend on GitHub Pages and a backend on a server. The backend must not serve the frontend.

## Decision

Deploy the frontend to GitHub Pages at https://baditaflorin.github.io/instant-cast/.

Deploy the backend with Docker Compose under `deploy/`:

- `app` pulls `ghcr.io/baditaflorin/instant-cast:latest`.
- `nginx` terminates TLS and exposes host port `25342`.
- Optional `prometheus` runs behind a Compose profile.
- `/metrics` is blocked publicly by nginx.

## Consequences

- Frontend and backend lifecycles are independent.
- CORS must allow the Pages origin.
- Operators can update the backend with `docker compose pull`.

## Alternatives Considered

- Single VPS serving both frontend and backend: rejected because Pages is required.
- Serverless upload endpoint: viable later, but Docker Compose is explicit and portable.
