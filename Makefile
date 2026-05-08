VERSION ?= $(shell node -p "require('./package.json').version")
COMMIT ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo local)
IMAGE ?= ghcr.io/baditaflorin/instant-cast
GO_PACKAGES := ./cmd/... ./internal/...

.PHONY: help install-hooks dev build data test test-integration smoke lint fmt pages-preview docker-build docker-push release compose-up compose-down clean hooks-pre-commit hooks-commit-msg hooks-pre-push hooks-post-merge

help:
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_-]+:.*##/ {printf "%-22s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install-hooks: ## Wire local git hooks
	@git config core.hooksPath .githooks
	@echo "Git hooks installed"

dev: ## Run locally
	@APP_SIGNING_SECRET="$${APP_SIGNING_SECRET:-dev-signing-secret-change-me-32-bytes}" APP_ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173" go run ./cmd/server & backend=$$!; trap "kill $$backend 2>/dev/null || true" EXIT; npm run dev

build: ## Build frontend into docs/
	@npm run generate:api
	@VITE_APP_VERSION="$(VERSION)" VITE_COMMIT_SHA="$(COMMIT)" npm run build
	@CGO_ENABLED=0 go build -trimpath -ldflags="-s -w -X main.version=$(VERSION) -X main.commit=$(COMMIT)" -o bin/instant-cast ./cmd/server
	@test -f docs/index.html
	@node -e "const fs=require('fs'); const html=fs.readFileSync('docs/index.html','utf8'); if(!html.includes('/instant-cast/assets/')) process.exit(1)"

data: ## Regenerate static data artifacts
	@echo "No static data pipeline in Mode C"

test: ## Run unit tests
	@npm test
	@CGO_ENABLED=0 go test $(GO_PACKAGES)

test-integration: ## Run integration tests
	@echo "No integration tests beyond smoke in v0.1.0"

smoke: ## Run smoke tests
	@scripts/smoke.sh

lint: ## Run linters
	@npm run lint
	@npm run fmt:check
	@CGO_ENABLED=0 go vet $(GO_PACKAGES)
	@if command -v golangci-lint >/dev/null 2>&1; then golangci-lint run; else echo "golangci-lint not installed; skipping"; fi
	@npm run audit:prod
	@if command -v govulncheck >/dev/null 2>&1; then CGO_ENABLED=0 govulncheck $(GO_PACKAGES); else echo "govulncheck not installed; skipping"; fi

fmt: ## Autoformat
	@npm run fmt
	@gofmt -w cmd internal

pages-preview: ## Serve docs/ locally exactly as Pages would
	node scripts/pages-server.mjs

docker-build: ## Build backend Docker image
	docker buildx build --platform linux/amd64 --load --build-arg VERSION=$(VERSION) --build-arg COMMIT=$(COMMIT) --build-arg CREATED="$$(date -u +%Y-%m-%dT%H:%M:%SZ)" -t $(IMAGE):latest -t $(IMAGE):$(COMMIT) .

docker-push: ## Push backend Docker image
	docker buildx build --platform linux/amd64 --push --build-arg VERSION=$(VERSION) --build-arg COMMIT=$(COMMIT) --build-arg CREATED="$$(date -u +%Y-%m-%dT%H:%M:%SZ)" -t $(IMAGE):latest -t $(IMAGE):v$(VERSION) -t $(IMAGE):$(COMMIT) .

release: ## Tag and release
	@git diff --quiet
	@git tag v$(VERSION)
	@git push origin v$(VERSION)
	@gh release create v$(VERSION) --title "v$(VERSION)" --notes "Instant Cast v$(VERSION)"

compose-up: ## Start local stack
	cd deploy && docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

compose-down: ## Stop local stack
	cd deploy && docker compose -f docker-compose.yml -f docker-compose.dev.yml down

clean: ## Remove generated artifacts
	rm -rf tmp coverage dist bin

hooks-pre-commit: ## Run pre-commit hook manually
	@.githooks/pre-commit

hooks-commit-msg: ## Run commit-msg hook manually with MSG=.git/COMMIT_EDITMSG
	@.githooks/commit-msg $${MSG:-.git/COMMIT_EDITMSG}

hooks-pre-push: ## Run pre-push hook manually
	@.githooks/pre-push

hooks-post-merge: ## Run post-merge hook manually
	@.githooks/post-merge
