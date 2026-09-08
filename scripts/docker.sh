#!/usr/bin/env bash
# ==========================================================
# Finora - Docker Stack Validation
#
# Validates the complete Docker application stack:
#
#   Browser
#      |
#      +----> Web / Nginx :80
#      |
#      +----> Backend :8000
#                    |
#                    +----> Neon PostgreSQL
#
# IMPORTANT:
#   - No PostgreSQL container is created.
#   - Neon PostgreSQL is the only database.
#   - Local backend/.env supplies the Neon connection.
#   - Root .env supplies VITE_API_URL for the frontend build.
#
# Usage:
#   ./scripts/docker.sh
#   ./scripts/docker.sh --keep
#
# --keep:
#   Keep the Docker stack running after validation.
#
# ==========================================================

set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}"

COMPOSE_FILE="${COMPOSE_FILE:-compose.yml}"
KEEP_STACK=false
FAILED=false

if [[ "${1:-}" == "--keep" ]]; then
    KEEP_STACK=true
elif [[ "${1:-}" != "" ]]; then
    echo "Usage: $0 [--keep]"
    exit 1
fi

# ----------------------------------------------------------
# Output helpers
# ----------------------------------------------------------

log() {
    printf '\n→ %s\n' "$1"
}

success() {
    printf '✓ %s\n' "$1"
}

error() {
    printf '✗ %s\n' "$1" >&2
}

# ----------------------------------------------------------
# Cleanup
# ----------------------------------------------------------

cleanup() {
    local exit_code=$?

    if [[ "${exit_code}" -ne 0 ]]; then
        FAILED=true

        echo
        echo "=========================================================="
        echo " Finora Docker Validation FAILED"
        echo "=========================================================="

        echo
        echo "--- Docker Compose status ---"
        docker compose -f "${COMPOSE_FILE}" ps || true

        echo
        echo "--- Backend health ---"
        docker inspect finora-backend \
            --format '{{if .State.Health}}{{.State.Health.Status}}{{end}}' \
            2>/dev/null || true

        echo
        echo "--- Backend health history ---"
        docker inspect finora-backend \
            --format '{{range .State.Health.Log}}{{println "exit=" .ExitCode}}{{println .Output}}{{end}}' \
            2>/dev/null || true

        echo
        echo "--- Backend logs ---"
        docker logs finora-backend --tail 200 2>/dev/null || true

        echo
        echo "--- Web logs ---"
        docker logs finora-web --tail 200 2>/dev/null || true
    fi

    if [[ "${KEEP_STACK}" == false ]]; then
        log "Stopping validation stack..."

        docker compose \
            -f "${COMPOSE_FILE}" \
            down --remove-orphans >/dev/null 2>&1 || true
    fi

    # Never leave Neon credentials on the runner.
    rm -f .env backend/.env

    exit "${exit_code}"
}

trap cleanup EXIT

# ----------------------------------------------------------
# Header
# ----------------------------------------------------------

echo
echo "=========================================================="
echo " Finora Docker Stack Validation"
echo "=========================================================="
echo
echo "Project : ${PROJECT_ROOT}"
echo "Compose : ${COMPOSE_FILE}"
echo "Database: Neon PostgreSQL"
echo

# ==========================================================
# 1. Toolchain validation
# ==========================================================

log "Checking Docker..."

command -v docker >/dev/null 2>&1 || {
    error "Docker is not installed."
    exit 1
}

docker info >/dev/null 2>&1 || {
    error "Docker daemon is not available."
    exit 1
}

docker compose version >/dev/null 2>&1 || {
    error "Docker Compose is not available."
    exit 1
}

success "Docker and Docker Compose are available."

# ==========================================================
# 2. Required project files
# ==========================================================

log "Checking required Docker files..."

required_files=(
    "${COMPOSE_FILE}"
    "backend/Dockerfile"
    "backend/requirements.txt"
    "infrastructure/web/Dockerfile"
    "infrastructure/web/nginx.conf"
    "frontend/package.json"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "${file}" ]]; then
        error "Missing required file: ${file}"
        exit 1
    fi
done

success "Required Docker files are present."

# ==========================================================
# 3. Create temporary Docker environment
# ==========================================================
#
# GitHub Actions runners do not contain the developer's .env
# files. The Docker Compose file intentionally references:
#
#   .env
#   backend/.env
#
# The workflow provides one secret:
#
#   NEON_DATABASE_URL
#
# This script converts that connection string into the
# application's existing POSTGRES_* environment contract.
#
# The files exist for the entire lifetime of this script and
# are deleted by cleanup(), including on failure.
#
# ==========================================================

log "Creating temporary Docker environment..."

if [[ -z "${NEON_DATABASE_URL:-}" ]]; then
    error "NEON_DATABASE_URL is not available."
    error "The Docker validation workflow must provide the GitHub Secret."
    exit 1
fi

if [[ "${NEON_DATABASE_URL}" != postgresql://* && \
      "${NEON_DATABASE_URL}" != postgres://* ]]; then
    error "NEON_DATABASE_URL is not a valid PostgreSQL connection string."
    exit 1
fi

if [[ "${NEON_DATABASE_URL}" != *"sslmode=require"* ]]; then
    error "NEON_DATABASE_URL must contain sslmode=require for Neon."
    exit 1
fi

# Never print the connection string.
python3 - <<'PY'
import os
import sys
from urllib.parse import urlsplit, unquote

url = os.environ["NEON_DATABASE_URL"]
parsed = urlsplit(url)

if parsed.scheme not in {"postgresql", "postgres"}:
    print("Invalid PostgreSQL URL scheme.")
    sys.exit(1)

if not parsed.hostname:
    print("NEON_DATABASE_URL is missing the database host.")
    sys.exit(1)

if not parsed.username:
    print("NEON_DATABASE_URL is missing the database username.")
    sys.exit(1)

if parsed.password is None:
    print("NEON_DATABASE_URL is missing the database password.")
    sys.exit(1)

database = parsed.path.lstrip("/")
if not database:
    print("NEON_DATABASE_URL is missing the database name.")
    sys.exit(1)

try:
    port = parsed.port or 5432
except ValueError:
    print("NEON_DATABASE_URL contains an invalid port.")
    sys.exit(1)

host = parsed.hostname
user = unquote(parsed.username)
password = unquote(parsed.password)

# Root .env consumed by compose.yml for the Vite build argument.
with open(".env", "w", encoding="utf-8") as f:
    f.write("VITE_API_URL=http://localhost:8000\n")
    f.write("DEBUG=true\n")
    f.write('BACKEND_CORS_ORIGINS=\'["http://localhost","http://localhost:80"]\'\n')

# backend/.env consumed by compose.yml.
# Keep the application's existing POSTGRES_* contract.
with open("backend/.env", "w", encoding="utf-8") as f:
    f.write("APP_NAME=Finora\n")
    f.write("DEBUG=true\n")
    f.write("DB_TYPE=postgresql\n")
    f.write(f"POSTGRES_HOST={host}\n")
    f.write(f"POSTGRES_PORT={port}\n")
    f.write(f"POSTGRES_USER={user}\n")
    f.write(f"POSTGRES_PASSWORD={password}\n")
    f.write(f"POSTGRES_DB={database}\n")
    f.write("POSTGRES_SSLMODE=require\n")
    f.write("SECRET_KEY=finora-docker-validation-secret\n")
    f.write("ALGORITHM=HS256\n")
    f.write("ACCESS_TOKEN_EXPIRE_MINUTES=60\n")
    f.write('BACKEND_CORS_ORIGINS=\'["http://localhost","http://localhost:80"]\'\n')
PY

chmod 600 .env backend/.env

success "Temporary root .env created."
success "Temporary backend/.env created from Neon connection string."
success "Neon credentials were not printed."

# ==========================================================
# 4. Validate Compose configuration
# ==========================================================

log "Validating Docker Compose configuration..."

docker compose -f "${COMPOSE_FILE}" config >/dev/null

success "Compose configuration is valid."

# ----------------------------------------------------------
# Ensure PostgreSQL is NOT defined as a Compose service.
# ----------------------------------------------------------

if docker compose -f "${COMPOSE_FILE}" config --services | grep -qx "postgres"; then
    error "Invalid architecture: postgres service exists in ${COMPOSE_FILE}."
    error "Finora uses Neon PostgreSQL externally."
    exit 1
fi

success "Compose architecture confirmed: no local PostgreSQL container."

# ==========================================================
# 5. Build backend and web images
# ==========================================================

log "Building backend and web images..."

docker compose \
    -f "${COMPOSE_FILE}" \
    build --pull backend web

success "Backend and web images built successfully."

# ==========================================================
# 6. Start backend
# ==========================================================

log "Starting backend container..."

docker compose \
    -f "${COMPOSE_FILE}" \
    up -d backend

# ----------------------------------------------------------
# Wait for backend health.
# Compose healthcheck is the source of truth.
# ----------------------------------------------------------

log "Waiting for backend health..."

backend_ready=false

for _ in {1..36}; do
    status="$(docker inspect \
        --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' \
        finora-backend 2>/dev/null || true)"

    case "${status}" in
        healthy)
            backend_ready=true
            break
            ;;
        unhealthy)
            break
            ;;
    esac

    sleep 5
done

if [[ "${backend_ready}" != true ]]; then
    error "Backend did not become healthy."

    echo
    echo "--- Backend health history ---"
    docker inspect finora-backend \
        --format '{{range .State.Health.Log}}{{println "exit=" .ExitCode}}{{println .Output}}{{end}}' \
        2>/dev/null || true

    echo
    echo "--- Backend logs ---"
    docker logs finora-backend --tail 200 2>/dev/null || true

    exit 1
fi

success "Backend container is healthy."

# ==========================================================
# 7. Validate backend HTTP endpoint
# ==========================================================

log "Testing backend health endpoint..."

backend_health="$(curl -fsS --max-time 10 \
    http://localhost:8000/api/v1/health)"

if [[ -z "${backend_health}" ]]; then
    error "Backend health endpoint returned an empty response."
    exit 1
fi

success "Backend API responded successfully."
echo "  Response: ${backend_health}"

# ==========================================================
# 8. Validate Neon connectivity from INSIDE backend
# ==========================================================
#
# This is intentionally performed inside the actual backend
# container. A host-side database test is not sufficient:
#
#   host -> Neon       !=       backend container -> Neon
#
# The command below uses the application's configured
# PostgreSQL environment and verifies a real SQL connection.
#
# No credentials are printed.
#
# ==========================================================

log "Testing Neon PostgreSQL connectivity from backend container..."

docker exec finora-backend python - <<'PY'
import os
import sys

try:
    import psycopg2
except ImportError as exc:
    print(f"psycopg2 import failed: {exc}")
    sys.exit(1)

host = os.environ.get("POSTGRES_HOST")
port = os.environ.get("POSTGRES_PORT", "5432")
user = os.environ.get("POSTGRES_USER")
password = os.environ.get("POSTGRES_PASSWORD")
database = os.environ.get("POSTGRES_DB")

missing = [
    name
    for name, value in {
        "POSTGRES_HOST": host,
        "POSTGRES_PORT": port,
        "POSTGRES_USER": user,
        "POSTGRES_PASSWORD": password,
        "POSTGRES_DB": database,
    }.items()
    if not value
]

if missing:
    print("Missing database environment variables: " + ", ".join(missing))
    sys.exit(1)

try:
    connection = psycopg2.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        dbname=database,
        sslmode="require",
        connect_timeout=10,
    )

    with connection.cursor() as cursor:
        cursor.execute("SELECT 1;")
        result = cursor.fetchone()

    connection.close()

    if result != (1,):
        print(f"Unexpected PostgreSQL response: {result}")
        sys.exit(1)

except Exception as exc:
    print(f"Neon PostgreSQL connection failed: {exc}")
    sys.exit(1)

print("Neon PostgreSQL connection successful.")
print("SQL test: SELECT 1 → 1")
PY

success "Backend container can connect to Neon PostgreSQL."

# ==========================================================
# 9. Validate web container
# ==========================================================

log "Starting web container..."

docker compose \
    -f "${COMPOSE_FILE}" \
    up -d web

log "Waiting for web health..."

web_ready=false

for _ in {1..24}; do
    status="$(docker inspect \
        --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' \
        finora-web 2>/dev/null || true)"

    case "${status}" in
        healthy)
            web_ready=true
            break
            ;;
        unhealthy)
            break
            ;;
    esac

    sleep 5
done

if [[ "${web_ready}" != true ]]; then
    error "Web container did not become healthy."

    echo
    echo "--- Web health history ---"
    docker inspect finora-web \
        --format '{{range .State.Health.Log}}{{println "exit=" .ExitCode}}{{println .Output}}{{end}}' \
        2>/dev/null || true

    echo
    echo "--- Web logs ---"
    docker logs finora-web --tail 200 2>/dev/null || true

    exit 1
fi

success "Web container is healthy."

# ==========================================================
# 10. Validate frontend HTTP response
# ==========================================================

log "Testing frontend..."

frontend_html="$(curl -fsS --max-time 10 http://localhost/)"

if ! grep -qi '<html' <<< "${frontend_html}"; then
    error "Frontend did not return valid HTML."
    exit 1
fi

success "Frontend returned valid HTML."

# ==========================================================
# 11. Validate web health endpoint
# ==========================================================

log "Testing Nginx web health endpoint..."

web_health="$(curl -fsS --max-time 10 http://localhost/web-health)"

if ! grep -qi 'web ok' <<< "${web_health}"; then
    error "Unexpected /web-health response: ${web_health}"
    exit 1
fi

success "Nginx web health endpoint responded successfully."

# ==========================================================
# 12. Validate compiled Vite API URL
# ==========================================================

log "Validating compiled frontend API configuration..."

if ! docker exec finora-web \
    sh -c "grep -R -F '${VITE_API_URL}' /usr/share/nginx/html/assets >/dev/null 2>&1"; then

    error "Compiled frontend bundle does not contain VITE_API_URL=${VITE_API_URL}."
    exit 1
fi

if docker exec finora-web \
    sh -c "grep -R -E 'VITE_API_URL.{0,80}/api/v1|${VITE_API_URL}/api/v1' /usr/share/nginx/html/assets >/dev/null 2>&1"; then

    error "Frontend bundle appears to contain /api/v1 inside VITE_API_URL."
    error "client.ts should own the /api/v1 prefix."
    exit 1
fi

success "Frontend contains the correct backend origin."

# ==========================================================
# 13. Validate running containers
# ==========================================================

log "Validating final Docker stack..."

backend_status="$(docker inspect --format '{{.State.Status}}' finora-backend)"
web_status="$(docker inspect --format '{{.State.Status}}' finora-web)"

if [[ "${backend_status}" != "running" ]]; then
    error "Backend container is not running: ${backend_status}"
    exit 1
fi

if [[ "${web_status}" != "running" ]]; then
    error "Web container is not running: ${web_status}"
    exit 1
fi

success "Backend and web containers are running."

# ==========================================================
# 14. Final Compose status
# ==========================================================

docker compose -f "${COMPOSE_FILE}" ps

echo
echo "=========================================================="
echo " Finora Docker Stack Validation PASSED"
echo "=========================================================="
echo
echo "✓ Backend image built"
echo "✓ Web image built"
echo "✓ Backend container healthy"
echo "✓ Backend API responding"
echo "✓ Neon PostgreSQL reachable from backend"
echo "✓ Web container healthy"
echo "✓ Nginx responding"
echo "✓ Frontend HTML served"
echo "✓ Vite API configuration validated"
echo "✓ No local PostgreSQL container"
echo

if [[ "${KEEP_STACK}" == true ]]; then
    echo "Docker stack is still running."
    echo "Stop it with:"
    echo "  docker compose -f ${COMPOSE_FILE} down"
else
    echo "Docker validation stack will be stopped automatically."
fi

exit 0
