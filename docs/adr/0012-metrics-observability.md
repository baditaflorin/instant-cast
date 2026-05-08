# 0012 - Metrics and Observability

## Status

Accepted

## Context

The backend handles uploads and signed downloads, so basic service health and performance need visibility. The frontend should not track users by default.

## Decision

Expose Prometheus metrics at `GET /metrics`, including Go runtime metrics and:

- HTTP request count by method, path, and status.
- HTTP request duration histogram.
- Uploaded encrypted bytes counter.
- Upload count counter.
- Share download count counter.

Do not add client analytics in v1.

## Consequences

- Operators can scrape metrics when they enable the Prometheus profile.
- Public `/metrics` is blocked by nginx in production.
- No PII is collected by the frontend.

## Alternatives Considered

- Plausible analytics: deferred because v1 does not need product analytics.
- Log-only observability: rejected because metrics are cheap and useful for the API.
