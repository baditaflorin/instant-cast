# Contributing

Thanks for improving Instant Cast.

## Local workflow

1. Install dependencies with `npm install`.
2. Run `make install-hooks`.
3. Make focused commits using Conventional Commits.
4. Run `make test` and `make smoke` before pushing.

## Commit style

Use Conventional Commits such as `feat: add recorder controls`, `fix: handle upload expiry`, or `docs: update runbook`.

## Security

Do not commit secrets. Use `.env.example` for placeholder configuration and keep real values in local `.env` files.
