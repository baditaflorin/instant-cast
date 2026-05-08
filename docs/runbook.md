# Runbook

Live site: https://baditaflorin.github.io/instant-cast/

Backend deploy guide: deploy/README.md

## Expected Resources

- API CPU: 1 shared vCPU is enough for signed upload/download.
- API memory: 512 MB.
- Disk: sized by encrypted upload retention. A 10 minute recording is commonly 50-300 MB before encryption.

## Debugging

```sh
docker compose -f deploy/docker-compose.yml ps
docker compose -f deploy/docker-compose.yml logs -f app
docker compose -f deploy/docker-compose.yml logs -f nginx
```

## Health

```sh
curl http://localhost:8080/healthz
curl http://localhost:8080/readyz
```

## Metrics

Prometheus scrapes `http://app:8080/metrics` inside the Compose network. nginx blocks public `/metrics`.

## Backups

Back up the `instant-cast-uploads` Docker volume if active signed links must survive host replacement.

## Escalation

- If uploads fail, check `APP_MAX_UPLOAD_BYTES`, disk space, and nginx request limits.
- If playback decrypts fail, confirm the URL fragment still contains `#key=`.
- If Pages assets 404, run `make build` and confirm `docs/index.html` references `/instant-cast/assets/`.
