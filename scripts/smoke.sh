#!/usr/bin/env sh
set -eu

npm run generate:api
npm run build
npm run test:e2e

APP_SIGNING_SECRET="${APP_SIGNING_SECRET:-dev-signing-secret-change-me-32-bytes}" \
APP_ADDR=":18080" \
APP_PUBLIC_BASE_URL="http://127.0.0.1:18080" \
APP_ALLOWED_ORIGINS="http://127.0.0.1:4173,http://localhost:4173" \
APP_UPLOAD_DIR="$(mktemp -d)" \
CGO_ENABLED=0 \
  go run ./cmd/server > /tmp/instant-cast-smoke.log 2>&1 &

server_pid=$!
cleanup() {
  kill "$server_pid" 2>/dev/null || true
}
trap cleanup EXIT

for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS http://127.0.0.1:18080/healthz >/dev/null; then
    break
  fi
  sleep 1
done

curl -fsS http://127.0.0.1:18080/readyz >/dev/null
curl -fsS http://127.0.0.1:18080/metrics | grep -q "instant_cast"
