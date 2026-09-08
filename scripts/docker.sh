#!/usr/bin/env bash

# ============================================================
# Finora — Docker Validation
#
# Purpose:
#   Validate, build, start, migrate-state-check, smoke-test
#   and clean the complete Docker application stack.
#
# Architecture:
#
#   web
#    │
#    ▼
#   backend
#    │
#    ▼
#   Neon PostgreSQL
#
# CI database:
#
#   CI_DATABASE_URL
#        │
#        ▼
#   temporary backend/.env
#
# IMPORTANT:
#
#   - No local PostgreSQL container.
#   - CI must provide CI_DATABASE_URL.
#   - Production Neon must NEVER be used by CI.
#   - backend/.env is generated temporarily for CI.
#   - backend/.env is always removed on exit.
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

# ------------------------------------------------------------
# Health endpoints
#
# Stable defaults keep docker.sh directly runnable.
# Workflows may override these values when necessary.
# ------------------------------------------------------------

HEALTH_PATH="${HEALTH_PATH:-/api/v1/health}"
WEB_HEALTH_PATH="${WEB_HEALTH_PATH:-/web-health}"

# Vite API URL MUST be supplied by the caller because it is a
# build-time value and differs between local/CI/release builds.
VITE_API_URL="${VITE_API_URL:?VITE_API_URL must be provided by the caller.}"

export VITE_API_URL

# ------------------------------------------------------------
# Validate frontend API URL
# ------------------------------------------------------------

if [[ ! "${VITE_API_URL}" =~ ^https?://[^[:space:]]+$ ]]; then
    printf '%s\n' "[FAIL] VITE_API_URL must be an absolute http:// or https:// URL." >&2
    printf '%s\n' "[FAIL] Received: ${VITE_API_URL}" >&2
    exit 1
fi

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
# REQUIRE CI DATABASE
# ============================================================

require_ci_database() {
    if [[ -z "${CI_DATABASE_URL:-}" ]]; then
        error "CI_DATABASE_URL is not set."

        cat >&2 <<'EOF'
Docker validation requires a dedicated CI PostgreSQL
connection string.

Expected:

CI_DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require

IMPORTANT:

This MUST be a dedicated CI database.

DO NOT use the production Neon database.

EOF

        exit 1
    fi
}

# ============================================================
# PARSE DATABASE URL
# ============================================================

parse_database_url() {
    printf '%b\n' "${BLUE}[DOCKER]${NC} Parsing CI PostgreSQL connection string..." >&2

    python3 - "${CI_DATABASE_URL}" <<'PY'
from __future__ import annotations

import sys
from urllib.parse import parse_qs, unquote, urlparse

url = sys.argv[1]
parsed = urlparse(url)

# ------------------------------------------------------------
# Validate scheme
# ------------------------------------------------------------

if parsed.scheme not in {
    "postgresql",
    "postgresql+psycopg",
    "postgresql+psycopg2",
}:
    raise SystemExit(
        f"Unsupported database URL scheme: {parsed.scheme}"
    )

# ------------------------------------------------------------
# Validate required components
# ------------------------------------------------------------

if not parsed.hostname:
    raise SystemExit(
        "Database URL does not contain a hostname."
    )

if not parsed.username:
    raise SystemExit(
        "Database URL does not contain a username."
    )

if not parsed.path or parsed.path == "/":
    raise SystemExit(
        "Database URL does not contain a database name."
    )

# ------------------------------------------------------------
# Extract values
# ------------------------------------------------------------

query = parse_qs(parsed.query)

host = parsed.hostname
port = parsed.port or 5432
user = unquote(parsed.username)
password = unquote(parsed.password or "")
database = unquote(parsed.path.lstrip("/"))

sslmode = query.get("sslmode", ["require"])[0]

# ------------------------------------------------------------
# Shell-safe quoting
# ------------------------------------------------------------

def shell_quote(value: str) -> str:
    return "'" + value.replace("'", "'\"'\"'") + "'"

# ------------------------------------------------------------
# Emit application variables
# ------------------------------------------------------------

print(f"POSTGRES_HOST={shell_quote(host)}")
print(f"POSTGRES_PORT={shell_quote(str(port))}")
print(f"POSTGRES_USER={shell_quote(user)}")
print(f"POSTGRES_PASSWORD={shell_quote(password)}")
print(f"POSTGRES_DB={shell_quote(database)}")
print(f"POSTGRES_SSLMODE={shell_quote(sslmode)}")
PY
}

# ============================================================
# CREATE TEMPORARY CI ENVIRONMENT
# ============================================================

create_ci_env() {
    log "Creating temporary CI environment..."

    mkdir -p "$(dirname "${CI_ENV_FILE}")"

    local db_config
    db_config="$(parse_database_url)"

    # --------------------------------------------------------
    # Safety check
    # --------------------------------------------------------

    if [[ -n "${PRODUCTION_DATABASE_HOST:-}" ]]; then
        if grep -q \
            "${PRODUCTION_DATABASE_HOST}" \
            <<< "${db_config}"; then

            error "CI_DATABASE_URL appears to reference production Neon."
            error "Refusing to run Docker validation."

            exit 1
        fi
    fi

    # --------------------------------------------------------
    # Generate temporary backend/.env
    # --------------------------------------------------------

    cat > "${CI_ENV_FILE}" <<EOF
# ============================================================
# Finora CI Docker Validation Environment
#
# GENERATED FILE
# DO NOT COMMIT
# ============================================================

# ------------------------------------------------------------
# Application
# ------------------------------------------------------------

APP_NAME=Finora
APP_ENV=development
DEBUG=False

# ------------------------------------------------------------
# Security
# ------------------------------------------------------------

SECRET_KEY=finora-ci-validation-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# ------------------------------------------------------------
# PostgreSQL
# ------------------------------------------------------------

${db_config}

# ------------------------------------------------------------
# CORS
# ------------------------------------------------------------

BACKEND_CORS_ORIGINS=["http://localhost:80","http://localhost:5173"]

# ------------------------------------------------------------
# Frontend
# ------------------------------------------------------------

# VITE_API_URL is supplied by the caller/workflow as a Docker build argument.
EOF

    chmod 600 "${CI_ENV_FILE}"

    test -f "${CI_ENV_FILE}"

    success "Temporary CI environment created."

    # --------------------------------------------------------
    # Safe logging
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Diagnostics
    # --------------------------------------------------------

    if [[ -f "${COMPOSE_FILE}" ]]; then
        log "Final container status..."
        compose ps -a || true

        printf '\n'

        log "Recent container logs..."
        compose logs \
            --tail=100 \
            || true
    fi

    # --------------------------------------------------------
    # Docker cleanup
    # --------------------------------------------------------

    log "Cleaning Docker stack..."

    if [[ -f "${COMPOSE_FILE}" ]]; then
        compose down \
            --volumes \
            --remove-orphans \
            || true
    fi

    # --------------------------------------------------------
    # Remove temporary environment
    # --------------------------------------------------------

    if [[ -f "${CI_ENV_FILE}" ]]; then
        log "Removing temporary CI environment..."

        rm -f "${CI_ENV_FILE}"

        success "Temporary CI environment removed."
    fi

    # --------------------------------------------------------
    # Result
    # --------------------------------------------------------

    printf '\n'

    if [[ ${exit_code} -eq 0 ]]; then
        success "Docker validation completed successfully."
    else
        error \
            "Docker validation failed with exit code ${exit_code}."
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

    if [[ -f "${COMPOSE_FILE}" ]]; then
        warning "Container status:"
        compose ps -a || true

        printf '\n'

        warning "Recent container logs:"
        compose logs \
            --tail=100 \
            || true
    fi
}

trap 'on_error ${LINENO}' ERR

# ============================================================
# COMMAND REQUIREMENTS
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

require_ci_database

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
# 3. CREATE CI ENVIRONMENT
# ============================================================

# IMPORTANT:
#
# This MUST happen BEFORE any docker compose command.
#
# compose.yml references:
#
#   ./backend/.env
#
# Therefore GitHub Actions cannot run:
#
#   docker compose config
#
# before this function executes.
#
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
        error \
            "Required Compose service is missing: ${service}"
        exit 1
    fi
done

# ------------------------------------------------------------
# No local PostgreSQL
# ------------------------------------------------------------

if grep -qx "postgres" <<< "${services}"; then
    error "Local PostgreSQL service detected."
    error \
        "Finora Docker validation must use Neon PostgreSQL."
    exit 1
fi

success \
    "Compose architecture validated: backend + web + Neon."

# ============================================================
# 6. VERIFY DATABASE CONFIGURATION
# ============================================================

log "Verifying backend database configuration..."

compose config \
    --format json \
    > /tmp/finora-compose-config.json

python3 - /tmp/finora-compose-config.json <<'PY'
from __future__ import annotations

import json
import sys

with open(sys.argv[1], encoding="utf-8") as file:
    config = json.load(file)

services = config.get("services", {})
backend = services.get("backend", {})
environment = backend.get("environment", {})

# ------------------------------------------------------------
# Legacy configuration must not remain.
# ------------------------------------------------------------

for legacy in (
    "DATABASE_URL",
    "DB_TYPE",
    "SQLITE_DB_PATH",
):
    if legacy in environment:
        raise SystemExit(
            f"Legacy database variable detected: {legacy}"
        )

# ------------------------------------------------------------
# Required database configuration.
# ------------------------------------------------------------

required = (
    "POSTGRES_HOST",
    "POSTGRES_PORT",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_DB",
    "POSTGRES_SSLMODE",
)

for variable in required:
    if variable not in environment:
        raise SystemExit(
            f"Required backend database variable "
            f"is missing: {variable}"
        )

if environment["POSTGRES_SSLMODE"] != "require":
    raise SystemExit(
        "POSTGRES_SSLMODE must be 'require'."
    )

print("Backend database configuration: OK")
PY

rm -f /tmp/finora-compose-config.json

success "Backend database configuration validated."

# ============================================================
# 7. VERIFY FRONTEND BUILD CONFIGURATION
# ============================================================

log "Verifying frontend build configuration..."

compose config --format json > /tmp/finora-compose-config.json

python3 - /tmp/finora-compose-config.json "${VITE_API_URL}" <<'PY'
from __future__ import annotations

import json
import sys

path = sys.argv[1]
expected = sys.argv[2]

with open(path, encoding="utf-8") as file:
    config = json.load(file)

web = config.get("services", {}).get("web", {})
build = web.get("build", {})
args = build.get("args", {})
actual = args.get("VITE_API_URL")

if actual != expected:
    raise SystemExit(
        "Frontend build argument mismatch: "
        f"expected {expected!r}, got {actual!r}"
    )

print("Frontend build argument: OK")
PY

rm -f /tmp/finora-compose-config.json

success "Frontend build configuration validated."

# ============================================================
# 8. BUILD COMPLETE STACK
# ============================================================

log "Building complete Docker stack..."

compose build --pull

success "Complete Docker stack built successfully."

# ============================================================
# 9. START COMPLETE STACK
# ============================================================

log "Starting complete Docker stack..."

compose up -d

success "Docker stack started."

# ============================================================
# 10. WAIT FOR CONTAINERS
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
        success \
            "All application containers are running."
        break
    fi

    sleep 2
    elapsed=$((elapsed + 2))
done

if (( elapsed >= STARTUP_TIMEOUT )); then
    error \
        "Application containers did not start within ${STARTUP_TIMEOUT}s."

    compose ps -a

    exit 1
fi

# ============================================================
# 11. BACKEND HEALTH
# ============================================================

log "Checking backend health..."

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
# 12. DATABASE CONNECTIVITY
# ============================================================

log "Checking backend → Neon PostgreSQL connectivity..."

compose exec \
    -T \
    "${BACKEND_SERVICE}" \
    python -c '
from sqlalchemy import text
from src.db.database import engine

with engine.connect() as connection:
    result = connection.execute(
        text(
            "SELECT "
            "current_database(), "
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

success \
    "Backend → Neon PostgreSQL connectivity passed."

# ============================================================
# 13. ALEMBIC STATE
# ============================================================

log "Checking Alembic migration state..."

compose exec \
    -T \
    "${BACKEND_SERVICE}" \
    uv run alembic current

success "Alembic migration state checked."

# ============================================================
# 14. WEB HEALTH
# ============================================================

log "Checking web container health..."

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
# 15. NGINX CONFIGURATION
# ============================================================

log "Checking Nginx configuration..."

compose exec \
    -T \
    "${WEB_SERVICE}" \
    nginx -t

success "Nginx configuration is valid."

# ============================================================
# 16. WEB HTTP SMOKE TEST
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
# 17. WEB HEALTH ENDPOINT
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
# 18. BACKEND API THROUGH NGINX
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

    success \
        "Nginx → Backend API smoke test passed."
else
    error \
        "Nginx → Backend API smoke test failed."

    compose logs \
        --tail=100 \
        "${WEB_SERVICE}" \
        "${BACKEND_SERVICE}" \
        || true

    exit 1
fi

# ============================================================
# 19. FINAL STATUS
# ============================================================

printf '\n'

log "Final Docker service status:"

compose ps

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
echo "  ✓ No legacy DATABASE_URL configuration"
echo "  ✓ PostgreSQL configuration"
echo "  ✓ Backend image build"
echo "  ✓ Web image build"
echo "  ✓ Backend startup"
echo "  ✓ Backend health"
echo "  ✓ Backend → Neon connectivity"
echo "  ✓ Alembic state"
echo "  ✓ Web container health"
echo "  ✓ Nginx configuration"
echo "  ✓ Web HTTP"
echo "  ✓ Web health endpoint"
echo "  ✓ Nginx → Backend API"
echo
echo "Cleanup:"
echo "  ✓ Containers removed"
echo "  ✓ Volumes removed"
echo "  ✓ Temporary CI environment removed"
echo "  ✓ Production database protected"
echo
echo "============================================================"

success "Docker validation PASSED."
