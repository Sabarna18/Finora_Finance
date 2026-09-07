# ============================================================
# Finora Makefile
# ============================================================
#
# Docker-first development and quality-gate orchestration.
#
# Project structure:
#
#   scripts/
#       backend-check.sh
#       db-check.sh
#       frontend-check.sh
#
#   backend/
#       scripts/
#           generate_db_summary.py
#
#   frontend/
#
#   compose.yml
#
#
# Quality architecture:
#
#                       make check
#                           │
#                           ▼
#                  Compose validation
#                           │
#                           ▼
#                Build / recreate Docker
#                           │
#                           ▼
#                       Backend
#                           │
#                           │ DATABASE_URL
#                           ▼
#                    Neon PostgreSQL
#                           │
#                           ▼
#                      Quality Gates
#                           │
#             ┌─────────────┼─────────────┐
#             ▼             ▼             ▼
#          Backend          DB          Frontend
#             │             │             │
#             ▼             ▼             ▼
#           Docker       Neon Cloud      Host
#
#
# IMPORTANT:
#
# `make check` is self-contained.
#
# It can be executed when:
#
#   - containers are stopped
#   - containers do not exist
#   - images do not exist
#
# The backend environment is automatically created.
#
# The Neon database is NOT created, stopped, or removed.
#
# After the quality gate finishes, Docker containers are
# automatically stopped and removed.
#
# ============================================================


# ============================================================
# SHELL
# ============================================================

SHELL := /bin/bash

.SHELLFLAGS := -euo pipefail -c


# ============================================================
# DOCKER
# ============================================================

COMPOSE := docker compose

COMPOSE_FILE := compose.yml

BACKEND_SERVICE := backend

WEB_SERVICE := web


# ============================================================
# PROJECT PATHS
# ============================================================

ROOT_DIR := $(CURDIR)

SCRIPTS_DIR := $(ROOT_DIR)/scripts

FRONTEND_DIR := $(ROOT_DIR)/frontend


# ============================================================
# QUALITY SCRIPTS
# ============================================================

BACKEND_CHECK := $(SCRIPTS_DIR)/backend-check.sh

DB_CHECK := $(SCRIPTS_DIR)/db-check.sh

FRONTEND_CHECK := $(SCRIPTS_DIR)/frontend-check.sh


# ============================================================
# PHONY TARGETS
# ============================================================

.PHONY: \
	help \
	up \
	down \
	restart \
	build \
	ps \
	logs \
	compose-check \
	script-check \
	wait \
	backend \
	backend-check \
	db \
	db-check \
	db-upgrade \
	frontend \
	frontend-check \
	check \
	check-fast \
	clean


# ============================================================
# DEFAULT TARGET
# ============================================================

.DEFAULT_GOAL := help


# ============================================================
# HELP
# ============================================================

help:
	@echo ""
	@echo "============================================================"
	@echo "                    Finora Makefile"
	@echo "============================================================"
	@echo ""
	@echo "Docker:"
	@echo "  make up               Start Docker environment"
	@echo "  make down             Stop and remove Docker containers"
	@echo "  make restart          Restart Docker environment"
	@echo "  make build            Build Docker images"
	@echo "  make ps               Show service status"
	@echo "  make logs             Follow service logs"
	@echo ""
	@echo "Backend:"
	@echo "  make backend          Backend quality gate"
	@echo "  make backend-check    Backend quality gate"
	@echo ""
	@echo "Database:"
	@echo "  make db               Neon database quality gate"
	@echo "  make db-check         Neon database quality gate"
	@echo "  make db-upgrade       Apply Alembic migrations to Neon"
	@echo ""
	@echo "Frontend:"
	@echo "  make frontend         Frontend quality gate"
	@echo "  make frontend-check   Frontend quality gate"
	@echo ""
	@echo "Quality:"
	@echo "  make compose-check    Validate Compose configuration"
	@echo "  make script-check     Validate quality scripts"
	@echo "  make wait             Wait for backend service"
	@echo "  make check            Complete quality gate + cleanup"
	@echo "  make check-fast       Fast quality gate + cleanup"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean            Stop and remove containers"
	@echo ""


# ============================================================
# DOCKER LIFECYCLE
# ============================================================

up:
	@echo ""
	@echo "============================================================"
	@echo " Starting Finora"
	@echo "============================================================"
	@echo ""

	$(COMPOSE) -f "$(COMPOSE_FILE)" up -d

	@echo ""


down:
	@echo ""
	@echo "============================================================"
	@echo " Stopping Finora"
	@echo "============================================================"
	@echo ""

	$(COMPOSE) -f "$(COMPOSE_FILE)" down --remove-orphans

	@echo ""
	@echo "✓ Docker containers stopped and removed"
	@echo ""


restart:
	@echo ""
	@echo "============================================================"
	@echo " Restarting Finora"
	@echo "============================================================"
	@echo ""

	$(COMPOSE) -f "$(COMPOSE_FILE)" restart


build:
	@echo ""
	@echo "============================================================"
	@echo " Building Finora Docker Images"
	@echo "============================================================"
	@echo ""

	$(COMPOSE) -f "$(COMPOSE_FILE)" build


ps:
	@echo ""
	@echo "============================================================"
	@echo " Finora Service Status"
	@echo "============================================================"
	@echo ""

	$(COMPOSE) -f "$(COMPOSE_FILE)" ps


logs:
	@echo ""
	@echo "============================================================"
	@echo " Following Finora Logs"
	@echo "============================================================"
	@echo ""

	$(COMPOSE) -f "$(COMPOSE_FILE)" logs -f


# ============================================================
# COMPOSE VALIDATION
# ============================================================

compose-check:
	@echo ""
	@echo "============================================================"
	@echo " Docker Compose Validation"
	@echo "============================================================"
	@echo ""

	@if [[ ! -f "$(COMPOSE_FILE)" ]]; then \
		echo "✗ Missing $(COMPOSE_FILE)"; \
		exit 1; \
	fi

	$(COMPOSE) -f "$(COMPOSE_FILE)" config --quiet

	@echo ""
	@echo "✓ Docker Compose configuration valid"
	@echo ""


# ============================================================
# QUALITY SCRIPT VALIDATION
# ============================================================

script-check:
	@echo ""
	@echo "============================================================"
	@echo " Quality Script Validation"
	@echo "============================================================"
	@echo ""

	@for script in \
		"$(BACKEND_CHECK)" \
		"$(DB_CHECK)" \
		"$(FRONTEND_CHECK)"; do \
		if [[ ! -f "$$script" ]]; then \
			echo "✗ Missing quality script:"; \
			echo "  $$script"; \
			exit 1; \
		fi; \
		if [[ ! -x "$$script" ]]; then \
			echo "✗ Quality script is not executable:"; \
			echo "  $$script"; \
			echo ""; \
			echo "Run:"; \
			echo "  chmod +x \"$$script\""; \
			exit 1; \
		fi; \
	done

	@echo "✓ All quality scripts are available"
	@echo ""


# ============================================================
# SERVICE READINESS
# ============================================================
#
# Neon PostgreSQL is an external managed service.
#
# Therefore:
#
#   - Do NOT wait for a postgres container.
#   - Do NOT run pg_isready.
#
# Database connectivity is validated by db-check.sh through
# the backend container using the application's DATABASE_URL.
#
# ============================================================

wait:
	@echo ""
	@echo "============================================================"
	@echo " Waiting for Backend"
	@echo "============================================================"
	@echo ""

	@for i in $$(seq 1 60); do \
		if $(COMPOSE) -f "$(COMPOSE_FILE)" exec -T \
			$(BACKEND_SERVICE) \
			python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')" \
			>/dev/null 2>&1; then \
			echo "✓ Backend is ready"; \
			break; \
		fi; \
		if [[ "$$i" -eq 60 ]]; then \
			echo "✗ Backend did not become ready"; \
			echo ""; \
			$(COMPOSE) -f "$(COMPOSE_FILE)" logs \
				$(BACKEND_SERVICE); \
			exit 1; \
		fi; \
		sleep 2; \
	done

	@echo ""
	@echo "✓ Backend service is ready"
	@echo ""


# ============================================================
# BACKEND QUALITY GATE
# ============================================================
#
# The backend quality script lives on the HOST:
#
#     scripts/backend-check.sh
#
# It is intentionally not mounted into the backend image.
#
# The script is streamed directly into the running backend
# container and executed with bash.
#
# ============================================================

backend: backend-check


backend-check:
	@echo ""
	@echo "============================================================"
	@echo "              BACKEND QUALITY GATE"
	@echo "============================================================"
	@echo ""

	@if [[ ! -f "$(BACKEND_CHECK)" ]]; then \
		echo "✗ Backend quality script not found:"; \
		echo "  $(BACKEND_CHECK)"; \
		exit 1; \
	fi

	@if [[ ! -r "$(BACKEND_CHECK)" ]]; then \
		echo "✗ Backend quality script is not readable:"; \
		echo "  $(BACKEND_CHECK)"; \
		exit 1; \
	fi

	@echo "→ Executing backend quality gate inside Docker..."
	@echo ""

	cat "$(BACKEND_CHECK)" | \
		$(COMPOSE) -f "$(COMPOSE_FILE)" exec -T \
		$(BACKEND_SERVICE) \
		bash -s

	@echo ""
	@echo "✓ Backend quality gate passed"
	@echo ""


# ============================================================
# DATABASE QUALITY GATE
# ============================================================
#
# Database = Neon PostgreSQL
#
# db-check.sh validates Neon through the backend container.
#
# No local PostgreSQL container is required.
#
# ============================================================

db: db-check


db-check:
	@echo ""
	@echo "============================================================"
	@echo "          NEON DATABASE QUALITY GATE"
	@echo "============================================================"
	@echo ""

	@if [[ ! -x "$(DB_CHECK)" ]]; then \
		echo "✗ Database quality script unavailable:"; \
		echo "  $(DB_CHECK)"; \
		exit 1; \
	fi

	@echo "→ Executing Neon database quality gate..."
	@echo ""

	bash "$(DB_CHECK)"

	@echo ""
	@echo "✓ Neon database quality gate passed"
	@echo ""


# ============================================================
# DATABASE MIGRATION
# ============================================================
#
# Explicit schema mutation.
#
# NOT part of:
#
#   make db-check
#   make check
#
# This executes Alembic against Neon PostgreSQL through the
# backend container.
#
# ============================================================

db-upgrade:
	@echo ""
	@echo "============================================================"
	@echo "          NEON DATABASE MIGRATION"
	@echo "============================================================"
	@echo ""

	$(COMPOSE) -f "$(COMPOSE_FILE)" exec -T \
		$(BACKEND_SERVICE) \
		alembic upgrade head

	@echo ""
	@echo "✓ Alembic migrations applied to Neon"
	@echo ""


# ============================================================
# FRONTEND QUALITY GATE
# ============================================================
#
# The production `web` container is intentionally Nginx/static
# only.
#
# Therefore frontend source validation runs on the host using
# the project's existing Node toolchain.
#
# No additional Docker service is introduced.
#
# ============================================================

frontend: frontend-check


frontend-check:
	@echo ""
	@echo "============================================================"
	@echo "              FRONTEND QUALITY GATE"
	@echo "============================================================"
	@echo ""

	@if [[ ! -x "$(FRONTEND_CHECK)" ]]; then \
		echo "✗ Frontend quality script unavailable:"; \
		echo "  $(FRONTEND_CHECK)"; \
		exit 1; \
	fi

	@echo "→ Executing frontend quality gate..."
	@echo ""

	bash "$(FRONTEND_CHECK)"

	@echo ""
	@echo "✓ Frontend quality gate passed"
	@echo ""


# ============================================================
# COMPLETE QUALITY GATE
# ============================================================
#
# Self-contained.
#
# Flow:
#
#   1. Validate Compose
#   2. Validate quality scripts
#   3. Build/recreate backend environment
#   4. Wait for backend
#   5. Backend quality
#   6. Neon database quality
#   7. Frontend quality
#   8. ALWAYS clean up Docker containers
#
# Neon itself is NEVER stopped or removed.
#
# ============================================================

check:
	@set -e; \
	cleanup() { \
		echo ""; \
		echo "============================================================"; \
		echo " Docker Cleanup"; \
		echo "============================================================"; \
		echo ""; \
		$(COMPOSE) -f "$(COMPOSE_FILE)" down --remove-orphans || true; \
		echo ""; \
		echo "✓ Docker containers stopped and removed"; \
		echo "✓ Neon PostgreSQL remains untouched"; \
		echo ""; \
	}; \
	trap cleanup EXIT INT TERM; \
	\
	echo ""; \
	echo "============================================================"; \
	echo "                 FINORA QUALITY GATE"; \
	echo "============================================================"; \
	echo ""; \
	\
	echo "Quality architecture:"; \
	echo ""; \
	echo "  Backend  → Docker backend container"; \
	echo "  Database → Neon PostgreSQL"; \
	echo "  Frontend → Host Node toolchain"; \
	echo "  Web      → Docker Nginx/static container"; \
	echo ""; \
	\
	echo "============================================================"; \
	echo " Pre-flight"; \
	echo "============================================================"; \
	echo ""; \
	$(MAKE) compose-check; \
	$(MAKE) script-check; \
	\
	echo ""; \
	echo "============================================================"; \
	echo " Starting Quality-Gate Environment"; \
	echo "============================================================"; \
	echo ""; \
	$(COMPOSE) -f "$(COMPOSE_FILE)" up -d --build --force-recreate; \
	\
	$(MAKE) wait; \
	\
	echo ""; \
	echo "============================================================"; \
	echo " Stage 1 / 3 — BACKEND"; \
	echo "============================================================"; \
	echo ""; \
	$(MAKE) backend-check; \
	\
	echo ""; \
	echo "============================================================"; \
	echo " Stage 2 / 3 — NEON DATABASE"; \
	echo "============================================================"; \
	echo ""; \
	$(MAKE) db-check; \
	\
	echo ""; \
	echo "============================================================"; \
	echo " Stage 3 / 3 — FRONTEND"; \
	echo "============================================================"; \
	echo ""; \
	$(MAKE) frontend-check; \
	\
	echo ""; \
	echo "============================================================"; \
	echo "            FINORA QUALITY GATE PASSED"; \
	echo "============================================================"; \
	echo ""; \
	echo "✓ Compose configuration"; \
	echo "✓ Backend service ready"; \
	echo "✓ Backend quality"; \
	echo "✓ Neon PostgreSQL connectivity"; \
	echo "✓ Neon database integrity"; \
	echo "✓ Alembic migration state"; \
	echo "✓ Frontend quality"; \
	echo ""; \
	echo "→ Docker cleanup will now run automatically."; \
	echo ""


# ============================================================
# FAST QUALITY GATE
# ============================================================
#
# Same quality gates, but skips Docker image rebuilding.
#
# It still recreates the backend container and automatically
# cleans it up after the gate.
#
# Neon PostgreSQL remains untouched.
#
# ============================================================

check-fast:
	@set -e; \
	cleanup() { \
		echo ""; \
		echo "============================================================"; \
		echo " Docker Cleanup"; \
		echo "============================================================"; \
		echo ""; \
		$(COMPOSE) -f "$(COMPOSE_FILE)" down --remove-orphans || true; \
		echo ""; \
		echo "✓ Docker containers stopped and removed"; \
		echo "✓ Neon PostgreSQL remains untouched"; \
		echo ""; \
	}; \
	trap cleanup EXIT INT TERM; \
	\
	echo ""; \
	echo "============================================================"; \
	echo "              FINORA FAST QUALITY GATE"; \
	echo "============================================================"; \
	echo ""; \
	\
	$(MAKE) compose-check; \
	$(MAKE) script-check; \
	\
	echo ""; \
	echo "→ Starting existing Docker images..."; \
	echo ""; \
	$(COMPOSE) -f "$(COMPOSE_FILE)" up -d --force-recreate; \
	\
	$(MAKE) wait; \
	\
	echo ""; \
	echo "Stage 1 / 3 — BACKEND"; \
	$(MAKE) backend-check; \
	\
	echo ""; \
	echo "Stage 2 / 3 — NEON DATABASE"; \
	$(MAKE) db-check; \
	\
	echo ""; \
	echo "Stage 3 / 3 — FRONTEND"; \
	$(MAKE) frontend-check; \
	\
	echo ""; \
	echo "============================================================"; \
	echo "          FINORA FAST QUALITY GATE PASSED"; \
	echo "============================================================"; \
	echo ""; \
	echo "→ Docker cleanup will now run automatically."; \
	echo ""


# ============================================================
# CLEAN
# ============================================================

clean:
	@echo ""
	@echo "============================================================"
	@echo " Cleaning Finora Docker Environment"
	@echo "============================================================"
	@echo ""

	$(COMPOSE) -f "$(COMPOSE_FILE)" down \
		--remove-orphans

	@echo ""
	@echo "✓ Docker environment cleaned"
	@echo "✓ Neon PostgreSQL remains untouched"
	@echo ""
