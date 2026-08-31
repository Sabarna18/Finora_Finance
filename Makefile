# ============================================================
# Finora - Project Makefile
# ============================================================

SHELL := /bin/bash


# ============================================================
# FULL LOCAL QUALITY CHECK
#
# Purpose:
#   Final lightweight verification before Git push.
#
# Backend:
#   Delegated to scripts/backend-check.sh
#
# Frontend:
#   Delegated to scripts/frontend-check.sh
#
# Environment-dependent validation such as:
#   - Docker
#   - PostgreSQL
#   - Alembic
#   - Security scanning
#   - Deployment validation
#
# is handled by GitHub Actions.
#
# Usage:
#
#   make check
#
# ============================================================

.PHONY: check

check:
	@echo ""
	@echo "============================================================"
	@echo " Finora - Full Project Quality Gate"
	@echo "============================================================"
	@echo ""

	@./scripts/backend-check.sh

	@./scripts/frontend-check.sh

	@echo ""
	@echo "============================================================"
	@echo " ✓ ALL CHECKS PASSED"
	@echo " Repository is ready to push."
	@echo "============================================================"
	@echo ""


# ============================================================
# FORMAT / AUTO-FIX
#
# Applies formatting and safe lint fixes without running the
# complete quality gate.
#
# Usage:
#
#   make format
#
# ============================================================

.PHONY: format

format:
	@echo ""
	@echo "============================================================"
	@echo " Finora - Format & Auto-Fix"
	@echo "============================================================"
	@echo ""

	@echo "→ Applying backend Ruff fixes..."
	cd backend && uv run ruff check src tests --fix

	@echo ""
	@echo "→ Formatting backend with Ruff..."
	cd backend && uv run ruff format src tests

	@echo ""
	@echo "→ Formatting backend with Black..."
	cd backend && uv run black src tests

	@echo ""
	@echo "→ Applying frontend ESLint safe fixes..."
	cd frontend && npm run lint -- --fix

	@echo ""
	@echo "============================================================"
	@echo " ✓ Formatting and safe fixes complete"
	@echo "============================================================"
	@echo ""


# ============================================================
# BACKEND CHECK
#
# Runs the complete backend local quality gate.
#
# Usage:
#
#   make backend-check
#
# ============================================================

.PHONY: backend-check

backend-check:
	@./scripts/backend-check.sh


# ============================================================
# FRONTEND CHECK
#
# Runs the complete frontend local quality gate.
#
# Usage:
#
#   make frontend-check
#
# ============================================================

.PHONY: frontend-check

frontend-check:
	@./scripts/frontend-check.sh


# ============================================================
# BACKEND TESTS
#
# Runs backend pytest independently.
#
# Usage:
#
#   make backend-test
#
# ============================================================

.PHONY: backend-test

backend-test:
	cd backend && uv run pytest


# ============================================================
# DATABASE UTILITIES
#
# These commands are intentionally NOT part of make check.
#
# They are developer utilities for local database work.
#
# Usage:
#
#   make db-upgrade
#   make db-check
#
# ============================================================

.PHONY: db-upgrade

db-upgrade:
	cd backend && uv run alembic upgrade head


.PHONY: db-check

db-check:
	cd backend && uv run alembic check


# ============================================================
# FRONTEND BUILD
#
# Runs the production frontend build independently.
#
# Usage:
#
#   make frontend-build
#
# ============================================================

.PHONY: frontend-build

frontend-build:
	cd frontend && npm run build


# ============================================================
# CLEAN
#
# Removes generated local development artifacts.
#
# Usage:
#
#   make clean
#
# ============================================================

.PHONY: clean

clean:
	rm -rf backend/.pytest_cache
	rm -rf backend/.ruff_cache
	rm -rf backend/.mypy_cache
	rm -rf backend/htmlcov
	rm -rf backend/.coverage

	rm -rf frontend/dist
	rm -rf frontend/.vite
	rm -rf frontend/coverage

	@echo "✓ Generated artifacts cleaned"

