# Makefile for MADFAM Biz Site

.PHONY: help install dev build start docker-build docker-up docker-down docker-dev clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	pnpm install

dev: ## Run development server locally
	cd apps/web && pnpm dev

build: ## Build the web app
	pnpm turbo build --filter=@madfam/web

start: ## Start production server locally
	cd apps/web && pnpm start

docker-build: ## Build Docker images
	docker-compose build

docker-up: ## Start production Docker containers
	docker-compose up web

docker-down: ## Stop all Docker containers
	docker-compose down

docker-dev: ## Start development Docker container with hot reload
	docker-compose up web-dev

docker-logs: ## View Docker logs
	docker-compose logs -f

clean: ## Clean build artifacts and dependencies
	@if [ "$$LOCAL_DESTRUCTIVE" != "yes" ]; then \
		echo "Refusing destructive clean. Re-run with LOCAL_DESTRUCTIVE=yes."; \
		exit 1; \
	fi
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf packages/*/node_modules
	rm -rf apps/web/.next
	rm -rf .turbo

# Local testing shortcuts
local-prod: docker-build docker-up ## Build and run production locally via Docker

local-dev: docker-dev ## Run development server via Docker with hot reload

# Port forwarding info
ports-info: ## Show port information
	@echo "Local URLs:"
	@echo "  Development (local): http://localhost:3000"
	@echo "  Development (Docker): http://localhost:3001"
	@echo "  Production (Docker): http://localhost:3000"
