#!/usr/bin/env bash

# ============================================================
# Finora — Docker Validation
#
# Purpose:
#   Validate, build, start, migrate, smoke-test and clean the
#   Docker application stack used by GitHub Actions.
#
# Current architecture:
#
#   backend
#      │
#      └── PostgreSQL supplied by CI environment
#
#   web
#      │
#      └── backend
#
# Production/local runtime:
#
#   backend → Neon PostgreSQL
#
# IMPORTANT:
#
#   This script MUST NOT run migrations against production Neon.
#
# Usage:
#
#   ./scripts/docker.sh
#
# Optional:
#
#   COMPOSE_FILE=compose.yml ./scripts/docker.sh
# ============================================================

set -Eeuo pipefail


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
#
# IMPORTANT:
#
# The production/local application uses Neon.
#
# Docker validation must NOT use production Neon.
#
# The CI Compose environment therefore receives database
# configuration from the CI Compose stack.
#
# The actual database host is expected to be supplied by the
# CI Compose configuration rather than hard-coded here.
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

APP_NAME=Finora
APP_ENV=testing
DEBUG=False

ENVIRONMENT=testing

# ------------------------------------------------------------
# Security
# ------------------------------------------------------------

SECRET_KEY=finora-ci-validation-secret-key
ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=60

JWT_SECRET_KEY=finora-ci-validation-jwt-secret

# ------------------------------------------------------------
# PostgreSQL
#
# These values are overridden by the CI Compose environment.
# ------------------------------------------------------------

POSTGRES_USER=finora
POSTGRES_PASSWORD=finora
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=finora
POSTGRES_SSLMODE=disable

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
# WEB DIAGNOSTICS
# ============================================================

diagnose_web_health() {

    local web_container_id

    printf '\n'

    echo "============================================================"
    echo " WEB CONTAINER HEALTH DIAGNOSTICS"
    echo "============================================================"


    # --------------------------------------------------------
    # Resolve web container
    # --------------------------------------------------------

    echo
    echo "[1/9] Resolving web container..."

    web_container_id="$(
        compose ps \
            -q \
            "${WEB_SERVICE}" \
            2>/dev/null || true
    )"

    if [[ -z "${web_container_id}" ]]; then

        error "Unable to resolve container for Compose service: ${WEB_SERVICE}"

        compose ps -a || true

        return 0

    fi

    echo "Compose service : ${WEB_SERVICE}"
    echo "Container ID    : ${web_container_id}"


    # --------------------------------------------------------
    # Container state
    # --------------------------------------------------------

    echo
    echo "[2/9] Container state"

    docker inspect \
        "${web_container_id}" \
        --format '
Name:        {{.Name}}
Status:      {{.State.Status}}
Running:     {{.State.Running}}
StartedAt:   {{.State.StartedAt}}
FinishedAt:  {{.State.FinishedAt}}
ExitCode:    {{.State.ExitCode}}
Error:       {{.State.Error}}
Health:      {{if .State.Health}}{{.State.Health.Status}}{{else}}NO HEALTHCHECK{{end}}
' \
        2>&1 || true


    # --------------------------------------------------------
    # Docker healthcheck configuration
    # --------------------------------------------------------

    echo
    echo "[3/9] Docker healthcheck configuration"

    docker inspect \
        "${web_container_id}" \
        --format '
Test:        {{json .Config.Healthcheck.Test}}
Interval:    {{.Config.Healthcheck.Interval}}
Timeout:     {{.Config.Healthcheck.Timeout}}
StartPeriod: {{.Config.Healthcheck.StartPeriod}}
Retries:     {{.Config.Healthcheck.Retries}}
' \
        2>&1 || true


    # --------------------------------------------------------
    # Healthcheck history
    # --------------------------------------------------------

    echo
    echo "[4/9] Docker healthcheck execution history"

    docker inspect \
        "${web_container_id}" \
        --format '
{{range .State.Health.Log}}
Start:       {{.Start}}
End:         {{.End}}
ExitCode:    {{.ExitCode}}
Output:
{{.Output}}
------------------------------------------------------------
{{end}}
' \
        2>&1 || true


    # --------------------------------------------------------
    # Current health
    # --------------------------------------------------------

    echo
    echo "[5/9] Current Docker health status"

    docker inspect \
        "${web_container_id}" \
        --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}NO HEALTHCHECK{{end}}' \
        2>&1 || true


    # --------------------------------------------------------
    # Nginx validation
    # --------------------------------------------------------

    echo
    echo "[6/9] Nginx configuration validation"

    compose exec \
        -T \
        "${WEB_SERVICE}" \
        nginx -t \
        2>&1 || true


    # --------------------------------------------------------
    # Internal web health endpoint
    # --------------------------------------------------------

    echo
    echo "[7/9] Testing ${WEB_HEALTH_PATH} from inside web container"

    compose exec \
        -T \
        "${WEB_SERVICE}" \
        sh -c "
            wget \
                --no-verbose \
                --tries=1 \
                --timeout=10 \
                -O - \
                'http://127.0.0.1${WEB_HEALTH_PATH}'
        " \
        2>&1 || true


    # --------------------------------------------------------
    # Host → Nginx
    # --------------------------------------------------------

    echo
    echo "[8/9] Testing web health endpoint from GitHub runner"

    curl \
        --verbose \
        --max-time 10 \
        "http://127.0.0.1:${WEB_PORT}${WEB_HEALTH_PATH}" \
        2>&1 || true


    # --------------------------------------------------------
    # Host → Nginx → React
    # --------------------------------------------------------

    echo
    echo "[9/9] Testing React root endpoint from GitHub runner"

    curl \
        --verbose \
        --max-time 10 \
        "http://127.0.0.1:${WEB_PORT}/" \
        2>&1 || true


    echo
    echo "============================================================"
    echo " END WEB CONTAINER HEALTH DIAGNOSTICS"
    echo "============================================================"
    echo
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

log "Checking required application services..."

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

success "Required application services are present."


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
                2>/dev/null || true
        )"

        if [[ "${state}" != "running" ]]; then

            all_running=false

            break

        fi

    done

    if [[ "${all_running}" == true ]]; then

        success "All required application containers are running."

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
            2>/dev/null || true
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
# 10. DATABASE MIGRATIONS
# ============================================================

log "Running Alembic migrations..."

compose exec \
    -T \
    "${BACKEND_SERVICE}" \
    alembic upgrade head

success "Database migrations completed successfully."


# ============================================================
# 11. WEB HEALTH
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

    if [[ "${web_health}" == "unhealthy" ]]; then

        error "Web container became unhealthy."

        diagnose_web_health

        exit 1

    fi

    if (( attempt == HEALTH_RETRIES )); then

        error "Web container did not become healthy."

        diagnose_web_health

        exit 1

    fi

    sleep 2

done


# ============================================================
# 12. WEB HTTP SMOKE TEST
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

        diagnose_web_health

        exit 1

    fi

    sleep 2

done


# ============================================================
# 13. WEB HEALTH ENDPOINT SMOKE TEST
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

    diagnose_web_health

    exit 1

fi


# ============================================================
# 14. FINAL SERVICE STATUS
# ============================================================

printf '\n'

log "Final Docker service status:"

compose ps

printf '\n'

success "Docker stack validation PASSED."