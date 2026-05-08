# Instant Cast Backend Deploy

Frontend URL: https://baditaflorin.github.io/instant-cast/

Backend image: ghcr.io/baditaflorin/instant-cast:latest

Repository: https://github.com/baditaflorin/instant-cast

## Prerequisites

- Docker Engine with Compose.
- DNS pointing your backend hostname at the server.
- TLS certificates under `/etc/letsencrypt/live/<hostname>/`.
- A random `APP_SIGNING_SECRET` with at least 32 bytes.

## First Deploy

```sh
cd deploy
cp .env.example .env
$EDITOR .env
docker compose pull
docker compose up -d
```

The public HTTPS port is `25342`.

## TLS

The sample nginx config uses `instant-cast.example.com`. Replace that name in `deploy/nginx/nginx.conf` and `APP_PUBLIC_BASE_URL`.

Generate certificates on the host with certbot or copy existing certificates into `/etc/letsencrypt`.

## Rollback

```sh
docker compose pull app
docker compose up -d app
```

To roll back to a specific tag, set the `app.image` value to `ghcr.io/baditaflorin/instant-cast:vX.Y.Z` and run `docker compose up -d`.

## Logs

```sh
docker compose logs -f app
docker compose logs -f nginx
```

## Backups

Encrypted blobs live in the `instant-cast-uploads` Docker volume. Back up that volume if signed links need to survive host replacement.
