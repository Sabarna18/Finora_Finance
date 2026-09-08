#!/usr/bin/env bash

# ============================================================
# Finora - Docker Stack Validation
# ============================================================
#
# Purpose:
#   Validate and run the complete local Docker application stack.
#
# Architecture:
#
#       Browser
#          │
#          ▼
#       finora-web :80
#          │
#          │ Vite bundle calls backend directly
#          ▼
#       finora-backend :8000
#          │
#          ▼
#       Neon PostgreSQL (cloud)
#
# IMPORTANT:
#
#   This stack intentionally has NO local PostgreSQL container.
#
#   Local Docker:
#
#       web       → local container
#       backend   → local container
#       database  → Neon PostgreSQL
#
#   This script:
#
#       1. validates Docker/Compose
#       2. validates required project files
#       3. validates local environment configuration
#       4. validates Compose configuration
#       5. builds backend/frontend images
#       6. starts the complete application stack
#       7. waits for backend/web health
#       8. validates HTTP endpoints
#       9. validates the frontend bundle API configuration
#      10. prints container status
#
#   CI, release and deployment workflows remain separate.
#
# ============================================================

set -Eeuo pipefail

# ============================================================
# PATHS
# ============================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/compose.yml"

BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

BACKEND_CONTAINER="${BACKEND_CONTAINER:-finora-backend}"
WEB_CONTAINER="${WEB_CONTAINER:-finora-web}"

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
WEB_URL="${WEB_URL:-http://localhost}"

BACKEND_HEALTH_URL="${BACKEND_URL}/api/v1/health"
WEB_HEALTH_URL="${WEB_URL}/web-health"

MAX_RETRIES="${MAX_RETRIES:-30}"
RETRY_INTERVAL="${RETRY_INTERVAL:-2}"

# ============================================================
# LOGGING
# ============================================================

print_header() {
    echo ""
    echo "============================================================"
    echo " $1"
    echo "============================================================"
    echo ""
}

print_step() {
    echo "→ $1"
}

print_success() {
    echo "✓ $1"
    echo ""
}

print_error() {
    echo ""
    echo "✗ $1"
    echo ""
}

# ============================================================
# FAILURE DIAGNOSTICS
# ============================================================

show_diagnostics() {
    echo ""
    echo "============================================================"
    echo " Docker Diagnostics"
    echo "============================================================"
    echo ""

    echo "Container status:"
    docker compose -f "${COMPOSE_FILE}" ps || true

    echo ""
    echo "Backend logs:"
    docker logs --tail 100 "${BACKEND_CONTAINER}" 2>&1 || true

    echo ""
    echo "Web logs:"
    docker logs --tail 100 "${WEB_CONTAINER}" 2>&1 || true
}

cleanup_on_failure() {
    local exit_code=$?

    if (( exit_code != 0 )); then
        show_diagnostics
        echo ""
        print_error "Docker stack validation failed"
    fi

    exit "${exit_code}"
}

trap cleanup_on_failure EXIT

# ============================================================
# COMMAND VALIDATION
# ============================================================

require_command() {
    local command_name="$1"

    if ! command -v "${command_name}" >/dev/null 2>&1; then
        print_error "Required command not found: ${command_name}"
        exit 1
    fi
}

# ============================================================
# START
# ============================================================

print_header "Finora Docker Stack Validation"

echo "Root directory     : ${ROOT_DIR}"
echo "Compose file       : ${COMPOSE_FILE}"
echo "Backend URL        : ${BACKEND_URL}"
echo "Web URL            : ${WEB_URL}"
echo "Backend container  : ${BACKEND_CONTAINER}"
echo "Web container      : ${WEB_CONTAINER}"
echo ""

# ============================================================
# 1. DOCKER TOOLCHAIN
# ============================================================

print_step "Validating Docker toolchain..."

require_command docker

docker --version
docker compose version

if ! docker info >/dev/null 2>&1; then
    print_error "Docker daemon is not running or is inaccessible."
    exit 1
fi

print_success "Docker toolchain available"

# ============================================================
# 2. PROJECT STRUCTURE
# ============================================================

print_step "Validating Docker project structure..."

required_files=(
    "${COMPOSE_FILE}"
    "${BACKEND_DIR}/Dockerfile"
    "${FRONTEND_DIR}/package.json"
    "${FRONTEND_DIR}/package-lock.json"
    "${ROOT_DIR}/infrastructure/web/Dockerfile"
    "${ROOT_DIR}/infrastructure/web/nginx.conf"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "${file}" ]]; then
        print_error "Missing required file: ${file}"
        exit 1
    fi
done

print_success "Docker project structure valid"

# ============================================================
# 3. LOCAL ENVIRONMENT
# ============================================================
#
# Compose consumes the developer's normal root .env and the
# backend's .env. This script never creates or overwrites them.
#
# VITE_API_URL must be the backend origin only because
# frontend/src/api/client.ts centrally appends /api/v1.
#
# ============================================================

print_step "Validating local application environment..."

if [[ ! -f "${ROOT_DIR}/.env" ]]; then
    print_error "Missing root .env file."
    echo "Create it with at least:"
    echo "  VITE_API_URL=http://localhost:8000"
    exit 1
fi

if [[ ! -f "${BACKEND_DIR}/.env" ]]; then
    print_error "Missing backend/.env file."
    echo "The backend requires its local development configuration."
    exit 1
fi

if ! grep -Eq '^VITE_API_URL=http://localhost:8000/?$' "${ROOT_DIR}/.env"; then
    print_error "Root .env must define VITE_API_URL=http://localhost:8000"
    echo "The frontend API client owns the /api/v1 prefix."
    exit 1
fi

if grep -Eq '^VITE_API_URL=.*\/api\/v1\/?$' "${ROOT_DIR}/.env"; then
    print_error "VITE_API_URL must not contain /api/v1."
    exit 1
fi

if ! grep -Eq '^BACKEND_CORS_ORIGINS=' "${BACKEND_DIR}/.env"; then
    print_error "backend/.env is missing BACKEND_CORS_ORIGINS."
    exit 1
fi

print_success "Local application environment valid"

# ============================================================
# 4. COMPOSE CONFIGURATION
# ============================================================

print_step "Validating Docker Compose configuration..."

cd "${ROOT_DIR}"

docker compose -f "${COMPOSE_FILE}" config --quiet

print_success "Docker Compose configuration valid"

# ============================================================
# 5. ARCHITECTURE VALIDATION
# ============================================================
#
# Verify that the local stack does NOT accidentally introduce
# a PostgreSQL container.
#
# ============================================================

print_step "Validating Docker architecture..."

COMPOSE_SERVICES="$(docker compose -f "${COMPOSE_FILE}" config --services)"

if ! grep -qx "backend" <<< "${COMPOSE_SERVICES}"; then
    print_error "Compose stack is missing backend service."
    exit 1
fi

if ! grep -qx "web" <<< "${COMPOSE_SERVICES}"; then
    print_error "Compose stack is missing web service."
    exit 1
fi

if grep -qx "postgres" <<< "${COMPOSE_SERVICES}"; then
    print_error "Local Compose must not run PostgreSQL."
    echo "Finora local architecture uses Neon PostgreSQL."
    exit 1
fi

if grep -Eiq 'postgres:(|[0-9])' <<< "${COMPOSE_SERVICES}"; then
    print_error "A PostgreSQL service was detected unexpectedly."
    exit 1
fi

print_success "Docker architecture valid"

# ============================================================
# 6. BUILD IMAGES
# ============================================================

print_header "Building Finora Docker Images"

print_step "Building backend and frontend images..."

docker compose -f "${COMPOSE_FILE}" build --pull

print_success "Docker images built successfully"

# ============================================================
# 7. START STACK
# ============================================================

print_header "Starting Finora Docker Stack"

print_step "Starting backend and web containers..."

docker compose -f "${COMPOSE_FILE}" up -d

print_success "Docker stack started"

# ============================================================
# 8. CONTAINER VALIDATION
# ============================================================

print_step "Validating running containers..."

if ! docker inspect "${BACKEND_CONTAINER}" >/dev/null 2>&1; then
    print_error "Backend container was not created: ${BACKEND_CONTAINER}"
    exit 1
fi

if ! docker inspect "${WEB_CONTAINER}" >/dev/null 2>&1; then
    print_error "Web container was not created: ${WEB_CONTAINER}"
    exit 1
fi

BACKEND_STATE="$(docker inspect -f '{{.State.Status}}' "${BACKEND_CONTAINER}")"
WEB_STATE="$(docker inspect -f '{{.State.Status}}' "${WEB_CONTAINER}")"

if [[ "${BACKEND_STATE}" != "running" ]]; then
    print_error "Backend container is not running: ${BACKEND_STATE}"
    exit 1
fi

if [[ "${WEB_STATE}" != "running" ]]; then
    print_error "Web container is not running: ${WEB_STATE}"
    exit 1
fi

print_success "Backend and web containers are running"

# ============================================================
# 9. BACKEND HEALTH
# ============================================================

print_header "Backend Runtime Validation"

print_step "Waiting for backend health endpoint..."

backend_healthy=false

for ((attempt=1; attempt<=MAX_RETRIES; attempt++)); do
    if curl --fail --silent --show-error \
        --max-time 5 \
        "${BACKEND_HEALTH_URL}" >/dev/null 2>&1; then

        backend_healthy=true
        break
    fi

    if (( attempt == MAX_RETRIES )); then
        print_error "Backend health check failed."
        echo "URL: ${BACKEND_HEALTH_URL}"
        exit 1
    fi

    echo "Backend not ready."
    echo "Retry ${attempt}/${MAX_RETRIES}..."
    sleep "${RETRY_INTERVAL}"
done

if [[ "${backend_healthy}" != true ]]; then
    print_error "Backend did not become healthy."
    exit 1
fi

BACKEND_RESPONSE="$(
    curl --fail --silent --show-error \
        --max-time 5 \
        "${BACKEND_HEALTH_URL}"
)"

echo "Backend response: ${BACKEND_RESPONSE}"

print_success "Backend health check passed"

# ============================================================
# 10. WEB HEALTH
# ============================================================

print_header "Frontend Runtime Validation"

print_step "Waiting for web health endpoint..."

web_healthy=false

for ((attempt=1; attempt<=MAX_RETRIES; attempt++)); do
    if curl --fail --silent --show-error \
        --max-time 5 \
        "${WEB_HEALTH_URL}" >/dev/null 2>&1; then

        web_healthy=true
        break
    fi

    if (( attempt == MAX_RETRIES )); then
        print_error "Web health check failed."
        echo "URL: ${WEB_HEALTH_URL}"
        exit 1
    fi

    echo "Web not ready."
    echo "Retry ${attempt}/${MAX_RETRIES}..."
    sleep "${RETRY_INTERVAL}"
done

if [[ "${web_healthy}" != true ]]; then
    print_error "Web container did not become healthy."
    exit 1
fi

WEB_RESPONSE="$(
    curl --fail --silent --show-error \
        --max-time 5 \
        "${WEB_HEALTH_URL}"
)"

echo "Web response: ${WEB_RESPONSE}"

print_success "Web health check passed"

# ============================================================
# 11. FRONTEND APPLICATION
# ============================================================

print_step "Validating frontend application..."

FRONTEND_RESPONSE="$(
    curl --fail --silent --show-error \
        --max-time 5 \
        "${WEB_URL}/"
)"

if ! grep -qi "<html" <<< "${FRONTEND_RESPONSE}"; then
    print_error "Frontend did not return an HTML application."
    exit 1
fi

print_success "Frontend application is being served"

# ============================================================
# 12. VITE API CONFIGURATION
# ============================================================
#
# The built frontend must contain the backend origin.
#
# Expected:
#
#     http://localhost:8000
#
# Not:
#
#     /api/v1
#     http://localhost:8000/api/v1
#
# The centralized Axios client adds /api/v1.
#
# ============================================================

print_step "Validating frontend API configuration..."

if ! docker exec "${WEB_CONTAINER}" \
    sh -c 'grep -R -F -q "http://localhost:8000" /usr/share/nginx/html/assets 2>/dev/null'; then

    print_error "Frontend bundle does not contain the expected backend origin."
    echo "Expected: http://localhost:8000"
    exit 1
fi

if docker exec "${WEB_CONTAINER}" \
    sh -c 'grep -R -F -q "http://localhost:8000/api/v1" /usr/share/nginx/html/assets 2>/dev/null'; then

    print_error "Frontend bundle contains /api/v1 inside VITE_API_URL."
    echo "The API version must be owned by frontend/src/api/client.ts."
    exit 1
fi

print_success "Frontend API configuration is correct"

# ============================================================
# 13. CONTAINER HEALTH STATUS
# ============================================================

print_step "Validating Docker health status..."

BACKEND_HEALTH="$(
    docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' \
        "${BACKEND_CONTAINER}"
)"

WEB_HEALTH="$(
    docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' \
        "${WEB_CONTAINER}"
)"

echo "Backend health : ${BACKEND_HEALTH}"
echo "Web health     : ${WEB_HEALTH}"
echo ""

if [[ "${BACKEND_HEALTH}" != "healthy" ]]; then
    print_error "Backend Docker healthcheck is not healthy."
    exit 1
fi

if [[ "${WEB_HEALTH}" != "healthy" ]]; then
    print_error "Web Docker healthcheck is not healthy."
    exit 1
fi

print_success "Docker healthchecks passed"

# ============================================================
# 14. FINAL STACK STATUS
# ============================================================

print_header "✓ FINORA DOCKER VALIDATION PASSED"

docker compose -f "${COMPOSE_FILE}" ps

echo ""
echo "Validated:"
echo "  ✓ Docker daemon"
echo "  ✓ Docker Compose"
echo "  ✓ Project structure"
echo "  ✓ Local environment"
echo "  ✓ Compose configuration"
echo "  ✓ Finora architecture"
echo "  ✓ Backend image build"
echo "  ✓ Frontend image build"
echo "  ✓ Backend container"
echo "  ✓ Web container"
echo "  ✓ Backend health endpoint"
echo "  ✓ Web health endpoint"
echo "  ✓ Frontend application"
echo "  ✓ Vite API configuration"
echo "  ✓ Docker healthchecks"
echo ""

echo "Runtime architecture:"
echo "  Browser"
echo "     ↓"
echo "  finora-web :80"
echo "     ↓"
echo "  Browser → finora-backend :8000"
echo "     ↓"
echo "  Neon PostgreSQL (cloud)"
echo ""

echo "Finora Docker stack is healthy and ready."
echo ""
