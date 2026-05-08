.PHONY: help install-hooks dev build data test test-integration smoke lint fmt pages-preview docker-build docker-push release compose-up compose-down clean

help:
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_-]+:.*##/ {printf "%-22s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install-hooks: ## Wire local git hooks
	@git config core.hooksPath .githooks
	@echo "Git hooks installed"

dev: ## Run locally
	@echo "Frontend/backend implementation pending"

build: ## Build frontend into docs/
	@test -f docs/index.html
	@echo "docs/index.html exists"

data: ## Regenerate static data artifacts
	@echo "No static data pipeline in Mode C"

test: ## Run unit tests
	@echo "Tests pending"

test-integration: ## Run integration tests
	@echo "Integration tests pending"

smoke: ## Run smoke tests
	@test -f docs/index.html
	@echo "Smoke passed"

lint: ## Run linters
	@echo "Linters pending"

fmt: ## Autoformat
	@echo "Formatters pending"

pages-preview: ## Serve docs/ locally exactly as Pages would
	python3 -m http.server 4173 --directory docs

docker-build: ## Build backend Docker image
	@echo "Mode C Docker implementation pending"

docker-push: ## Push backend Docker image
	@echo "Mode C Docker implementation pending"

release: ## Tag and release
	@echo "Release implementation pending"

compose-up: ## Start local stack
	@echo "Compose implementation pending"

compose-down: ## Stop local stack
	@echo "Compose implementation pending"

clean: ## Remove generated artifacts
	rm -rf tmp coverage
