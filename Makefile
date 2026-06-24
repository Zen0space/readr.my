# Local dev stack orchestration for Auror.
#
# Supabase is managed by the `supabase` CLI (separate Docker containers,
# separate lifecycle) and Redis is managed by `docker compose` in this
# repo. These targets bring both up/down with one command — they are
# idempotent and safe to re-run.
#
# App services (backend, reader, author, admin, caddy) are profile-gated in
# docker-compose.yml and run via `pnpm dev` on the host during development.

.PHONY: up down status restart help
.DEFAULT_GOAL := help

COMPOSE    := docker compose
SUPABASE   := supabase

help: ## Show available targets.
	@awk 'BEGIN {FS = ":.*##"; printf "Targets:\n"} \
		/^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2 }' \
		$(MAKEFILE_LIST)

up: ## Start Supabase (CLI) + Redis (compose).
	@echo "==> Starting Supabase..."
	@$(SUPABASE) start
	@echo "==> Starting Redis..."
	@$(COMPOSE) up -d redis

down: ## Stop Redis + Supabase. Data volumes are preserved.
	@echo "==> Stopping Redis..."
	@$(COMPOSE) down
	@echo "==> Stopping Supabase..."
	@$(SUPABASE) stop

status: ## Show status of both stacks.
	@$(SUPABASE) status || true
	@echo ""
	@$(COMPOSE) ps

restart: down up ## Restart both stacks.
