# ============================================================
# Finora - Project Makefile
# ============================================================

SHELL := /bin/bash

ROOT_DIR := $(shell pwd)


# ============================================================
# PHONY TARGETS
# ============================================================

.PHONY: check
.PHONY: require-docker-services
.PHONY: backend-check
.PHONY: backend-test
.PHONY: frontend-check
.PHONY: frontend-build
.PHONY: db-check
.PHONY: db-upgrade
.PHONY: format
.PHONY: clean


# ============================================================
# DOCKER ENVIRONMENT VALIDATION
#
# Required by:
#
#   - make check
#   - make backend-check
#   - make backend-test
#   - make db-check
#   - make db-upgrade
#
# Required running services:
#
#   backend
#   postgres
#
# The database and backend quality gates intentionally execute
# inside the backend container.
#
# Docker network:
#
#   backend → postgres:5432
#
# ============================================================

require-docker-services:
	@echo "→ Checking required Docker services..."

	@if ! docker info >/dev/null 2>&1; then \
		echo ""; \
		echo "✗ Docker daemon is not running or is not accessible."; \
		echo ""; \
		echo "Start Docker and try again."; \
		echo ""; \
		exit 1; \
	fi

	@if ! docker compose ps --status running --services | grep -qx 'postgres'; then \
		echo ""; \
		echo "✗ Finora PostgreSQL container is not running."; \
		echo ""; \
		echo "Start the Finora Docker environment with:"; \
		echo ""; \
		echo "    docker compose up -d"; \
		echo ""; \
		exit 1; \
	fi

	@if ! docker compose ps --status running --services | grep -qx 'backend'; then \
		echo ""; \
		echo "✗ Finora backend container is not running."; \
		echo ""; \
		echo "Start the Finora Docker environment with:"; \
		echo ""; \
		echo "    docker compose up -d"; \
		echo ""; \
		exit 1; \
	fi

	@echo "✓ Required Docker services are running"
	@echo ""


# ============================================================
# FULL LOCAL QUALITY GATE
#
# Execution order:
#
#   1. Backend quality
#   2. Database validation
#   3. Frontend quality
#
# IMPORTANT:
#
#   Backend and database validation execute INSIDE Docker.
#
#       backend-check.sh
#              │
#              ▼
#       backend container
#
#       db-check.sh
#              │
#              ▼
#       backend container
#              │
#              ▼
#       postgres:5432
#
#   Frontend validation remains host-side.
#
# REQUIREMENT:
#
#   Docker services must be running before:
#
#       make check
#
# ============================================================

check: require-docker-services
	@echo "============================================================"
	@echo " Finora - Full Project Quality Gate"
	@echo "============================================================"
	@echo ""

	@echo "============================================================"
	@echo " [1/3] BACKEND QUALITY GATE"
	@echo "============================================================"
	@echo ""

	@$(MAKE) backend-check

	@echo ""
	@echo "============================================================"
	@echo " [2/3] DATABASE QUALITY GATE"
	@echo "============================================================"
	@echo ""

	@$(MAKE) db-check

	@echo ""
	@echo "============================================================"
	@echo " [3/3] FRONTEND QUALITY GATE"
	@echo "============================================================"
	@echo ""

	@$(MAKE) frontend-check

	@echo ""
	@echo "============================================================"
	@echo " ✓ ALL QUALITY GATES PASSED"
	@echo "============================================================"
	@echo ""

	@echo "Backend   : PASS"
	@echo "Database  : PASS"
	@echo "Frontend  : PASS"
	@echo ""

	@echo "Repository is ready for Git push."
	@echo ""


# ============================================================
# BACKEND QUALITY GATE
#
# Executes inside the running backend container.
#
# The container provides:
#
#   - Python environment
#   - uv environment
#   - locked dependencies
#   - application source
#   - test environment
#
# Database/Alembic validation is intentionally NOT performed
# here.
#
# ============================================================

backend-check: require-docker-services
	@docker compose exec backend ./scripts/backend-check.sh


# ============================================================
# BACKEND TESTS
#
# Runs pytest inside the backend container.
#
# ============================================================

backend-test: require-docker-services
	@docker compose exec backend uv run pytest


# ============================================================
# DATABASE CHECK
#
# Executes db-check.sh inside the backend container.
#
# db-check.sh validates:
#
#   - PostgreSQL availability
#   - PostgreSQL authentication
#   - Alembic current
#   - Alembic heads
#   - Alembic migration consistency
#
# Docker network:
#
#   backend → postgres:5432
#
# IMPORTANT:
#
#   This target NEVER applies migrations.
#
# ============================================================

db-check: require-docker-services
	@docker compose exec backend ./scripts/db-check.sh


# ============================================================
# DATABASE MIGRATION
#
# Explicitly applies pending migrations.
#
# IMPORTANT:
#
#   This operation modifies the database schema.
#
#   Alembic executes inside the backend container and connects
#   to PostgreSQL through:
#
#       postgres:5432
#
#   This target is intentionally NOT part of:
#
#       make check
#
# ============================================================

db-upgrade: require-docker-services
	@echo ""
	@echo "============================================================"
	@echo " Finora - Database Migration"
	@echo "============================================================"
	@echo ""

	@echo "→ Applying database migrations..."
	@echo ""

	@docker compose exec backend uv run alembic upgrade head

	@echo ""
	@echo "✓ Database migrations applied successfully."
	@echo ""


# ============================================================
# FRONTEND QUALITY GATE
#
# Delegated to:
#
#     scripts/frontend-check.sh
#
# This remains host-side.
#
# ============================================================

frontend-check:
	@./scripts/frontend-check.sh


# ============================================================
# FRONTEND PRODUCTION BUILD
#
# Runs the production build independently.
#
# ============================================================

frontend-build:
	@cd frontend && npm run build


# ============================================================
# FORMAT / AUTO-FIX
#
# Applies safe formatting/lint fixes.
#
# Backend formatting executes inside Docker so that formatting
# uses the same Python tooling as the backend quality gate.
#
# Frontend formatting remains host-side.
#
# ============================================================

format: require-docker-services
	@echo ""
	@echo "============================================================"
	@echo " Finora - Format & Auto-Fix"
	@echo "============================================================"
	@echo ""

	@echo "→ Applying backend Ruff fixes..."
	@docker compose exec backend uv run ruff check src tests --fix

	@echo ""
	@echo "→ Formatting backend with Ruff..."
	@docker compose exec backend uv run ruff format src tests

	@echo ""
	@echo "→ Formatting backend with Black..."
	@docker compose exec backend uv run black src tests

	@echo ""
	@echo "→ Applying frontend ESLint safe fixes..."
	@cd frontend && npm run lint -- --fix

	@echo ""
	@echo "============================================================"
	@echo " ✓ Formatting and safe fixes complete"
	@echo "============================================================"
	@echo ""


# ============================================================
# CLEAN
#
# Removes generated local development artifacts.
#
# Does NOT remove:
#
#   - .env
#   - databases
#   - Docker volumes
#   - source code
#
# ============================================================

clean:
	@rm -rf backend/.pytest_cache
	@rm -rf backend/.ruff_cache
	@rm -rf backend/.mypy_cache
	@rm -rf backend/htmlcov
	@rm -rf backend/.coverage
	@rm -rf frontend/dist
	@rm -rf frontend/.vite
	@rm -rf frontend/coverage

	@echo "✓ Generated artifacts cleaned"

