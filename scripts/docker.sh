#!/usr/bin/env bash

# ============================================================
# Finora — Docker Validation
#
# Purpose:
#   Validate, build, start, migrate, smoke-test and clean the
#   complete Docker Compose stack before images are published.
#
# Docker services:
#   - postgres
#   - backend
#   - web
#
# Usage:
#   ./scripts/docker.sh
#
# Optional:
#   COMPOSE_FILE=compose.yml ./scripts/docker.sh
# ============================================================

set -Eeuo pipefail


# ============================================================
# CONFIGURATION
# ============================================================

PROJECT_NAME="${COMPOSE_PROJECT_NAME:-finora-ci}"

COMPOSE_FILE="${COMPOSE_FILE:-compose.yml}"

DATABASE_SERVICE="${DATABASE_SERVICE:-postgres}"
BACKEND_SERVICE="${BACKEND_SERVICE:-backend}"
WEB_SERVICE="${WEB_SERVICE:-web}"

WEB_PORT="${WEB_PORT:-80}"

HEALTH_PATH="${HEALTH_PATH:-/api/v1/health}"

STARTUP_TIMEOUT="${STARTUP_TIMEOUT:-120}"
HEALTH_RETRIES="${HEALTH_RETRIES:-30}"

CI_ENV_FILE="${CI_ENV_FILE:-backend/.env}"

export COMPOSE_PROJECT_NAME="${PROJECT_NAME}"


# ============================================================
# COLORS
# ============================================================

if [[ -t 1 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi


# ============================================================
# LOGGING
# ============================================================

log() {
    printf '%b\n' "${BLUE}[DOCKER]${NC} $*"
}

success() {
    printf '%b\n' "${GREEN}[PASS]${NC} $*"
}

warning() {
    printf '%b\n' "${YELLOW}[WARN]${NC} $*"
}

error() {
    printf '%b\n' "${RED}[FAIL]${NC} $*" >&2
}


# ============================================================
# COMPOSE COMMAND
# ============================================================

compose() {
    docker compose \
        -f "${COMPOSE_FILE}" \
        "$@"
}


# ============================================================
# TEMPORARY CI ENVIRONMENT
# ============================================================

create_ci_env() {
    log "Creating temporary CI environment..."

    mkdir -p "$(dirname "${CI_ENV_FILE}")"

    cat > "${CI_ENV_FILE}" <<'EOF'
# ============================================================
# Finora CI Docker Validation Environment
#
# Generated automatically by scripts/docker.sh
# DO NOT COMMIT THIS FILE.
# ============================================================

# ------------------------------------------------------------
# Application
# ------------------------------------------------------------

ENVIRONMENT=testing
APP_ENV=testing

# ------------------------------------------------------------
# Security
# ------------------------------------------------------------

SECRET_KEY=finora-ci-validation-secret-key
JWT_SECRET_KEY=finora-ci-validation-jwt-secret

# ------------------------------------------------------------
# PostgreSQL
# ------------------------------------------------------------

POSTGRES_USER=finora
POSTGRES_PASSWORD=finora
POSTGRES_DB=finora

# ------------------------------------------------------------
# Database
# ------------------------------------------------------------

DATABASE_URL=postgresql+psycopg://finora:finora@postgres:5432/finora

# ------------------------------------------------------------
# CORS
# ------------------------------------------------------------

CORS_ORIGINS=["http://localhost:80","http://localhost:5173"]

# ------------------------------------------------------------
# Frontend
# ------------------------------------------------------------

VITE_API_URL=/api/v1
EOF

    test -f "${CI_ENV_FILE}"

    success "Temporary CI environment created: ${CI_ENV_FILE}"
}


# ============================================================
# CLEANUP
# ============================================================

cleanup() {
    local exit_code=$?

    printf '\n'

    log "Collecting final container status..."

    compose ps || true

    printf '\n'

    log "Cleaning Docker stack..."

    compose down \
        --volumes \
        --remove-orphans \
        || true

    if [[ -f "${CI_ENV_FILE}" ]]; then
        log "Removing temporary CI environment..."

        rm -f "${CI_ENV_FILE}"

        success "Temporary CI environment removed."
    fi

    printf '\n'

    if [[ ${exit_code} -eq 0 ]]; then
        success "Docker validation completed successfully."
    else
        error "Docker validation failed with exit code ${exit_code}."
    fi

    exit "${exit_code}"
}

trap cleanup EXIT


# ============================================================
# FAILURE HANDLER
# ============================================================

on_error() {
    local line="$1"

    error "Failure detected at line ${line}."

    printf '\n'

    warning "Container status:"

    compose ps || true

    printf '\n'

    warning "Recent container logs:"

    compose logs \
        --tail=100 \
        || true
}

trap 'on_error ${LINENO}' ERR


# ============================================================
# REQUIREMENTS
# ============================================================

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        error "Required command not found: $1"
        exit 1
    fi
}


# ============================================================
# 1. ENVIRONMENT VALIDATION
# ============================================================

log "Checking Docker environment..."

require_command docker
require_command curl

if ! docker info >/dev/null 2>&1; then
    error "Docker daemon is not available."
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    error "Docker Compose is not available."
    exit 1
fi

success "Docker environment is available."


# ============================================================
# 2. COMPOSE FILE VALIDATION
# ============================================================

log "Checking Compose file..."

if [[ ! -f "${COMPOSE_FILE}" ]]; then
    error "Compose file not found: ${COMPOSE_FILE}"
    exit 1
fi

success "Compose file found: ${COMPOSE_FILE}"


# ============================================================
# 3. CREATE TEMPORARY CI ENVIRONMENT
# ============================================================

create_ci_env


# ============================================================
# 4. DOCKER COMPOSE VALIDATION
# ============================================================

log "Validating Compose configuration..."

compose config --quiet

success "Compose configuration is valid."


# ============================================================
# 5. REQUIRED SERVICES
# ============================================================

log "Checking required services..."

services="$(
    compose config --services
)"

required_services=(
    "${DATABASE_SERVICE}"
    "${BACKEND_SERVICE}"
    "${WEB_SERVICE}"
)

for service in "${required_services[@]}"; do

    if ! grep -qx "${service}" <<< "${services}"; then
        error "Required Compose service is missing: ${service}"
        exit 1
    fi

done

success "Required Docker services are present."


# ============================================================
# 6. BUILD ENTIRE STACK
# ============================================================

log "Building complete Docker stack..."

compose build \
    --pull

success "Complete Docker stack built successfully."


# ============================================================
# 7. START ENTIRE STACK
# ============================================================

log "Starting complete Docker stack..."

compose up \
    -d

success "Docker stack started."


# ============================================================
# 8. WAIT FOR CONTAINERS
# ============================================================

log "Waiting for containers to initialize..."

elapsed=0

while (( elapsed < STARTUP_TIMEOUT )); do

    all_running=true

    for service in "${required_services[@]}"; do

        state="$(
            compose ps \
                "${service}" \
                --format '{{.State}}' \
                2>/dev/null || true
        )"

        if [[ "${state}" != "running" ]]; then
            all_running=false
            break
        fi

    done

    if [[ "${all_running}" == true ]]; then
        success "All required containers are running."
        break
    fi

    sleep 2

    elapsed=$((elapsed + 2))

done


if (( elapsed >= STARTUP_TIMEOUT )); then
    error "Containers did not become ready within ${STARTUP_TIMEOUT}s."
    exit 1
fi


# ============================================================
# 9. DATABASE HEALTH
# ============================================================

log "Checking PostgreSQL health..."

db_health=""

for ((attempt=1; attempt<=HEALTH_RETRIES; attempt++)); do

    db_health="$(
        compose ps \
            "${DATABASE_SERVICE}" \
            --format '{{.Health}}' \
            2>/dev/null || true
    )"

    if [[ "${db_health}" == "healthy" ]]; then
        success "PostgreSQL health check passed."
        break
    fi

    if (( attempt == HEALTH_RETRIES )); then
        error "PostgreSQL did not become healthy."

        compose logs \
            --tail=100 \
            "${DATABASE_SERVICE}" \
            || true

        exit 1
    fi

    sleep 2

done


# ============================================================
# 10. BACKEND HEALTH
#
# Backend port 8000 is intentionally INTERNAL.
#
# compose.yml uses:
#
#   expose:
#     - "8000"
#
# Therefore localhost:8000 on the GitHub runner cannot be used.
#
# Docker's native HEALTHCHECK validates:
#
#   http://localhost:8000/api/v1/health
#
# from INSIDE the backend container.
# ============================================================

log "Checking backend health..."

backend_health=""

for ((attempt=1; attempt<=HEALTH_RETRIES; attempt++)); do

    backend_health="$(
        compose ps \
            "${BACKEND_SERVICE}" \
            --format '{{.Health}}' \
            2>/dev/null || true
    )"

    if [[ "${backend_health}" == "healthy" ]]; then
        success "Backend health check passed."
        break
    fi

    if (( attempt == HEALTH_RETRIES )); then
        error "Backend did not become healthy."

        compose logs \
            --tail=100 \
            "${BACKEND_SERVICE}" \
            || true

        exit 1
    fi

    sleep 2

done


# ============================================================
# 11. DATABASE MIGRATIONS
# ============================================================

log "Running Alembic migrations..."

compose exec \
    -T \
    "${BACKEND_SERVICE}" \
    alembic upgrade head

success "Database migrations completed successfully."


# ============================================================
# 12. WEB HEALTH
# ============================================================

log "Checking web container health..."

web_health=""

for ((attempt=1; attempt<=HEALTH_RETRIES; attempt++)); do

    web_health="$(
        compose ps \
            "${WEB_SERVICE}" \
            --format '{{.Health}}' \
            2>/dev/null || true
    )"

    if [[ "${web_health}" == "healthy" ]]; then
        success "Web container health check passed."
        break
    fi

    if (( attempt == HEALTH_RETRIES )); then
        error "Web container did not become healthy."

        compose logs \
            --tail=100 \
            "${WEB_SERVICE}" \
            || true

        exit 1
    fi

    sleep 2

done


# ============================================================
# 13. WEB HTTP SMOKE TEST
#
# web is the only application service published to the host:
#
#   80:80
#
# Therefore localhost:80 is valid from the GitHub runner.
# ============================================================

log "Checking web HTTP endpoint..."

web_url="http://localhost:${WEB_PORT}/"

for ((attempt=1; attempt<=HEALTH_RETRIES; attempt++)); do

    if curl \
        --fail \
        --silent \
        --show-error \
        --max-time 10 \
        "${web_url}" \
        >/dev/null; then

        success "Web HTTP smoke test passed."
        break
    fi

    if (( attempt == HEALTH_RETRIES )); then
        error "Web HTTP smoke test failed."
        exit 1
    fi

    sleep 2

done


# ============================================================
# 14. FINAL SERVICE STATUS
# ============================================================

printf '\n'

log "Final Docker service status:"

compose ps

printf '\n'

success "Docker stack validation PASSED."