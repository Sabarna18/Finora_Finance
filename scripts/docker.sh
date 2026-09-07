#!/usr/bin/env bash

# ============================================================
# Finora — Docker Validation
#
# Purpose:
#   Validate, build, start, migrate, smoke-test and clean the
#   complete Docker application stack used by GitHub Actions.
#
# Architecture:
#
#   web
#    │
#    ▼
#   backend
#    │
#    │ PostgreSQL / SSL
#    ▼
#   Neon PostgreSQL
#
# IMPORTANT:
#
#   - There is NO local PostgreSQL container.
#   - Neon is the database provider.
#   - GitHub Actions MUST provide a dedicated CI Neon database.
#   - Production Neon MUST NOT be used for this validation.
#
# Usage:
#
#   ./scripts/docker.sh
#
# Optional:
#
#   COMPOSE_FILE=compose.yml ./scripts/docker.sh
#
# Required environment:
#
#   CI_DATABASE_URL
#
# Example:
#
#   CI_DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
#
# ============================================================

set -Eeuo pipefail


# ============================================================
# PROJECT ROOT
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"


# ============================================================
# CONFIGURATION
# ============================================================

PROJECT_NAME="${COMPOSE_PROJECT_NAME:-finora-ci}"

COMPOSE_FILE="${COMPOSE_FILE:-compose.yml}"

BACKEND_SERVICE="${BACKEND_SERVICE:-backend}"
WEB_SERVICE="${WEB_SERVICE:-web}"

WEB_PORT="${WEB_PORT:-80}"

WEB_HEALTH_PATH="${WEB_HEALTH_PATH:-/web-health}"
HEALTH_PATH="${HEALTH_PATH:-/api/v1/health}"

STARTUP_TIMEOUT="${STARTUP_TIMEOUT:-120}"
HEALTH_RETRIES="${HEALTH_RETRIES:-30}"

CI_ENV_FILE="${CI_ENV_FILE:-backend/.env}"


# ============================================================
# REQUIRED CI DATABASE
# ============================================================

if [[ -z "${CI_DATABASE_URL:-}" ]]; then
    printf '\033[0;31m[FAIL]\033[0m CI_DATABASE_URL is not set.\n' >&2

    cat >&2 <<'EOF'

Docker validation requires a dedicated CI Neon PostgreSQL
connection string.

Expected:

  CI_DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require

Do NOT use the production database.

EOF

    exit 1
fi


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
# DATABASE URL PARSING
# ============================================================
#
# The application configuration uses:
#
#   POSTGRES_HOST
#   POSTGRES_PORT
#   POSTGRES_USER
#   POSTGRES_PASSWORD
#   POSTGRES_DB
#   POSTGRES_SSLMODE
#
# Therefore the CI Neon DATABASE_URL is converted into the
# variables expected by backend/.env.
#
# Python stdlib is used only for safe URL parsing.
#
# ============================================================

parse_database_url() {

    log "Parsing CI Neon PostgreSQL connection string..."

    python3 - "${CI_DATABASE_URL}" <<'PY'
from __future__ import annotations

import sys
from urllib.parse import parse_qs, unquote, urlparse

url = sys.argv[1]

parsed = urlparse(url)

if parsed.scheme not in {
    "postgresql",
    "postgresql+psycopg",
    "postgresql+psycopg2",
}:
    raise SystemExit(
        f"Unsupported database URL scheme: {parsed.scheme}"
    )

if not parsed.hostname:
    raise SystemExit("Database URL does not contain a hostname.")

if not parsed.username:
    raise SystemExit("Database URL does not contain a username.")

if not parsed.path or parsed.path == "/":
    raise SystemExit("Database URL does not contain a database name.")

query = parse_qs(parsed.query)

host = parsed.hostname
port = parsed.port or 5432
user = unquote(parsed.username)
password = unquote(parsed.password or "")
database = unquote(parsed.path.lstrip("/"))

sslmode = query.get("sslmode", ["require"])[0]

# Emit shell-safe KEY=value pairs.
# Password may contain shell-special characters, so use
# Python repr-style single-quoted shell values.
def shell_quote(value: str) -> str:
    return "'" + value.replace("'", "'\"'\"'") + "'"

print(f"POSTGRES_HOST={shell_quote(host)}")
print(f"POSTGRES_PORT={shell_quote(str(port))}")
print(f"POSTGRES_USER={shell_quote(user)}")
print(f"POSTGRES_PASSWORD={shell_quote(password)}")
print(f"POSTGRES_DB={shell_quote(database)}")
print(f"POSTGRES_SSLMODE={shell_quote(sslmode)}")
PY
}


# ============================================================
# TEMPORARY CI ENVIRONMENT
# ============================================================

create_ci_env() {

    log "Creating temporary CI environment..."

    mkdir -p "$(dirname "${CI_ENV_FILE}")"

    # Parse the dedicated CI Neon URL.
    db_config="$(
        parse_database_url
    )"

    # IMPORTANT:
    #
    # This file intentionally replaces the local backend/.env
    # during CI validation.
    #
    # The Compose file already consumes:
    #
    #   ./backend/.env
    #
    # Therefore we do NOT modify compose.yml.
    #

    cat > "${CI_ENV_FILE}" <<EOF
# ============================================================
# Finora CI Docker Validation Environment
#
# Generated automatically by scripts/docker.sh
# DO NOT COMMIT THIS FILE.
# ============================================================

# ------------------------------------------------------------
# Application
# ------------------------------------------------------------

APP_NAME=Finora
APP_ENV=development
ENVIRONMENT=development
DEBUG=False

# ------------------------------------------------------------
# Security
# ------------------------------------------------------------

SECRET_KEY=finora-ci-validation-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_SECRET_KEY=finora-ci-validation-jwt-secret

# ------------------------------------------------------------
# PostgreSQL / Neon
# ------------------------------------------------------------

${db_config}

# ------------------------------------------------------------
# CORS
# ------------------------------------------------------------

BACKEND_CORS_ORIGINS=["http://localhost:80","http://localhost:5173"]
CORS_ORIGINS=["http://localhost:80","http://localhost:5173"]

# ------------------------------------------------------------
# Frontend
# ------------------------------------------------------------

VITE_API_URL=/api/v1
EOF

    test -f "${CI_ENV_FILE}"

    success "Temporary CI environment created: ${CI_ENV_FILE}"

    # Never print the actual database password.
    log "CI database configuration:"
    grep -E \
        '^(POSTGRES_HOST|POSTGRES_PORT|POSTGRES_USER|POSTGRES_DB|POSTGRES_SSLMODE)=' \
        "${CI_ENV_FILE}" \
        || true
}


# ============================================================
# CLEANUP
# ============================================================

cleanup() {

    local exit_code=$?

    printf '\n'

    log "Collecting final container status..."

    compose ps -a || true

    printf '\n'

    log "Collecting recent container logs..."

    compose logs \
        --tail=100 \
        || true

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

    compose ps -a || true

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
require_command python3

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
# 4. COMPOSE CONFIGURATION VALIDATION
# ============================================================

log "Validating Compose configuration..."

compose config --quiet

success "Compose configuration is valid."


# ============================================================
# 5. VERIFY COMPOSE ARCHITECTURE
# ============================================================

log "Validating Compose service architecture..."

services="$(
    compose config --services
)"

required_services=(
    "${BACKEND_SERVICE}"
    "${WEB_SERVICE}"
)

for service in "${required_services[@]}"; do

    if ! grep -qx "${service}" <<< "${services}"; then

        error "Required Compose service is missing: ${service}"

        exit 1

    fi

done


# ------------------------------------------------------------
# Ensure local PostgreSQL service does NOT exist.
# ------------------------------------------------------------

if grep -qx "postgres" <<< "${services}"; then

    error "Local PostgreSQL service detected."

    error "Finora uses Neon PostgreSQL as its database."

    exit 1

fi

success "Compose architecture validated: backend + web + Neon."


# ============================================================
# 6. BUILD COMPLETE STACK
# ============================================================

log "Building complete Docker stack..."

compose build \
    --pull

success "Complete Docker stack built successfully."


# ============================================================
# 7. START COMPLETE STACK
# ============================================================

log "Starting complete Docker stack..."

compose up \
    -d

success "Docker stack started."


# ============================================================
# 8. WAIT FOR APPLICATION CONTAINERS
# ============================================================

log "Waiting for application containers..."

elapsed=0

while (( elapsed < STARTUP_TIMEOUT )); do

    all_running=true

    for service in "${required_services[@]}"; do

        state="$(
            compose ps \
                "${service}" \
                --format '{{.State}}' \
                2>/dev/null \
                || true
        )"

        if [[ "${state}" != "running" ]]; then

            all_running=false

            break

        fi

    done

    if [[ "${all_running}" == true ]]; then

        success "All application containers are running."

        break

    fi

    sleep 2

    elapsed=$((elapsed + 2))

done


if (( elapsed >= STARTUP_TIMEOUT )); then

    error "Application containers did not start within ${STARTUP_TIMEOUT}s."

    compose ps -a

    exit 1

fi


# ============================================================
# 9. BACKEND HEALTH
# ============================================================

log "Checking backend health..."

backend_health=""

for ((attempt=1; attempt<=HEALTH_RETRIES; attempt++)); do

    backend_health="$(
        compose ps \
            "${BACKEND_SERVICE}" \
            --format '{{.Health}}' \
            2>/dev/null \
            || true
    )"

    if [[ "${backend_health}" == "healthy" ]]; then

        success "Backend health check passed."

        break

    fi

    if [[ "${backend_health}" == "unhealthy" ]]; then

        error "Backend container became unhealthy."

        compose logs \
            --tail=100 \
            "${BACKEND_SERVICE}" \
            || true

        exit 1

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
# 10. DATABASE CONNECTIVITY
# ============================================================
#
# Do NOT run migrations here unless the CI database is explicitly
# dedicated to CI.
#
# This connection check verifies:
#
#   Docker backend
#        ↓
#   SQLAlchemy
#        ↓
#   Neon PostgreSQL
#
# ============================================================

log "Checking backend → Neon PostgreSQL connectivity..."

compose exec \
    -T \
    "${BACKEND_SERVICE}" \
    python -c '
from sqlalchemy import create_engine, text
from src.db.database import DATABASE_URL

engine = create_engine(DATABASE_URL)

with engine.connect() as connection:
    result = connection.execute(
        text(
            "SELECT current_database(), "
            "current_user, "
            "version()"
        )
    )

    database, user, version = result.fetchone()

print("Database:", database)
print("User:", user)
print("Server:", version.split(",")[0])
print("Neon PostgreSQL connectivity: OK")
'

success "Backend → Neon PostgreSQL connectivity passed."


# ============================================================
# 11. ALEMBIC MIGRATION STATE
# ============================================================

log "Checking Alembic migration state..."

compose exec \
    -T \
    "${BACKEND_SERVICE}" \
    alembic current

success "Alembic migration state checked."


# ============================================================
# 12. WEB CONTAINER HEALTH
# ============================================================

log "Checking web container health..."

web_health=""

for ((attempt=1; attempt<=HEALTH_RETRIES; attempt++)); do

    web_health="$(
        compose ps \
            "${WEB_SERVICE}" \
            --format '{{.Health}}' \
            2>/dev/null \
            || true
    )"

    if [[ "${web_health}" == "healthy" ]]; then

        success "Web container health check passed."

        break

    fi

    if [[ "${web_health}" == "unhealthy" ]]; then

        error "Web container became unhealthy."

        compose logs \
            --tail=100 \
            "${WEB_SERVICE}" \
            || true

        exit 1

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
# 13. NGINX CONFIGURATION
# ============================================================

log "Checking Nginx configuration..."

compose exec \
    -T \
    "${WEB_SERVICE}" \
    nginx -t

success "Nginx configuration is valid."


# ============================================================
# 14. WEB HTTP SMOKE TEST
# ============================================================

log "Checking web HTTP endpoint..."

web_url="http://127.0.0.1:${WEB_PORT}/"

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

        compose logs \
            --tail=100 \
            "${WEB_SERVICE}" \
            || true

        exit 1

    fi

    sleep 2

done


# ============================================================
# 15. WEB HEALTH ENDPOINT
# ============================================================

log "Checking web health endpoint..."

web_health_url="http://127.0.0.1:${WEB_PORT}${WEB_HEALTH_PATH}"

if curl \
    --fail \
    --silent \
    --show-error \
    --max-time 10 \
    "${web_health_url}" \
    >/dev/null; then

    success "Web health endpoint smoke test passed."

else

    error "Web health endpoint smoke test failed."

    compose logs \
        --tail=100 \
        "${WEB_SERVICE}" \
        || true

    exit 1

fi


# ============================================================
# 16. BACKEND API THROUGH NGINX
# ============================================================
#
# This is an important integration test.
#
# We don't only test:
#
#   runner → web
#
# We test:
#
#   runner
#      ↓
#   Nginx
#      ↓
#   backend
#      ↓
#   Neon
#
# ============================================================

log "Checking API through Nginx reverse proxy..."

api_url="http://127.0.0.1:${WEB_PORT}${HEALTH_PATH}"

if curl \
    --fail \
    --silent \
    --show-error \
    --max-time 10 \
    "${api_url}" \
    >/dev/null; then

    success "Nginx → Backend API smoke test passed."

else

    error "Nginx → Backend API smoke test failed."

    compose logs \
        --tail=100 \
        "${WEB_SERVICE}" \
        "${BACKEND_SERVICE}" \
        || true

    exit 1

fi


# ============================================================
# 17. FINAL SERVICE STATUS
# ============================================================

printf '\n'

log "Final Docker service status:"

compose ps

printf '\n'

success "Docker stack validation PASSED."

printf '\n'

echo "============================================================"
echo " Finora Docker Validation Summary"
echo "============================================================"
echo
echo "Architecture:"
echo "  web → backend → Neon PostgreSQL"
echo
echo "Validated:"
echo "  ✓ Docker environment"
echo "  ✓ Compose configuration"
echo "  ✓ No local PostgreSQL service"
echo "  ✓ Backend image build"
echo "  ✓ Web image build"
echo "  ✓ Backend startup"
echo "  ✓ Backend health"
echo "  ✓ Backend → Neon connectivity"
echo "  ✓ Alembic state"
echo "  ✓ Web container health"
echo "  ✓ Nginx configuration"
echo "  ✓ React/web HTTP"
echo "  ✓ Web health endpoint"
echo "  ✓ Nginx → Backend API"
echo
echo "Cleanup:"
echo "  ✓ Docker resources removed on exit"
echo "  ✓ Temporary CI environment removed"
echo "  ✓ Neon database left untouched"
echo
echo "============================================================"

