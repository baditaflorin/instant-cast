# GitHub Pages Deploy

Live GitHub Pages URL: https://baditaflorin.github.io/instant-cast/

Repository URL: https://github.com/baditaflorin/instant-cast

Instant Cast publishes the frontend from the `main` branch `docs/` directory. The backend deploy guide is `deploy/README.md`.

## Publish

```sh
make build
git add docs
git commit -m "chore: publish pages"
git push origin main
```

`make build` writes Vite output to `dist/` first, then copies the app shell into `docs/` while preserving `docs/adr/`, `docs/architecture.md`, and other project documentation.

## Roll Back

Revert the publishing commit and push `main`.

## Custom Domain

No custom domain is configured for v1. To add one, create `docs/CNAME` with the domain and configure DNS according to GitHub Pages documentation.
