FROM golang:1.26-alpine AS builder

ARG VERSION=0.1.0
ARG COMMIT=local

RUN apk add --no-cache ca-certificates
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY cmd ./cmd
COPY internal ./internal
COPY pkg ./pkg

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
  -trimpath \
  -ldflags="-s -w -X main.version=${VERSION} -X main.commit=${COMMIT}" \
  -o /out/instant-cast ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot

ARG VERSION=0.1.0
ARG COMMIT=local
ARG CREATED=unknown

LABEL org.opencontainers.image.source="https://github.com/baditaflorin/instant-cast" \
  org.opencontainers.image.revision="${COMMIT}" \
  org.opencontainers.image.version="${VERSION}" \
  org.opencontainers.image.created="${CREATED}" \
  org.opencontainers.image.licenses="MIT" \
  org.opencontainers.image.title="instant-cast"

WORKDIR /
COPY --from=builder /out/instant-cast /instant-cast

USER nonroot:nonroot
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD ["/instant-cast", "healthcheck"]

ENTRYPOINT ["/instant-cast"]
