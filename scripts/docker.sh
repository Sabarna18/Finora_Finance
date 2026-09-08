#!/usr/bin/env bash
# ==========================================================
# Finora - Docker Stack Validation
#
# Purpose:
#   Build, start, validate and clean the complete Docker stack
#   against the REAL Neon PostgreSQL database.
#
# Architecture:
#
#   Browser
#      |
#      +----> Finora Web / Nginx :80
#      |
#      +----> Finora Backend :8000
#                    |
#                    +----> Neon PostgreSQL (SSL)
#
# IMPORTANT:
#   - No PostgreSQL container is created.
#   - No CI PostgreSQL is created.
#   - NEON_DATABASE_URL is supplied by the caller.
#   - Temporary .env and backend/.env are created HERE.
#   - Those files remain available for the entire script run.
#   - Both files are removed during cleanup.
#
# Usage:
#   ./scripts/docker.sh
#   ./scripts/docker.sh --keep
#
# ==========================================================

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

COMPOSE_FILE="${COMPOSE_FILE:-compose.yml}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-finora-docker-validation}"

BACKEND_CONTAINER="${BACKEND_CONTAINER:-finora-backend}"
WEB_CONTAINER="${WEB_CONTAINER:-finora-web}"

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
BACKEND_HEALTH_URL="${BACKEND_HEALTH_URL:-http://localhost:8000/api/v1/health}"
WEB_URL="${WEB_URL:-http://localhost}"
WEB_HEALTH_URL="${WEB_HEALTH_URL:-http://localhost/web-health}"

KEEP_STACK=false
TEMP_ROOT_ENV=".env"
TEMP_BACKEND_ENV="backend/.env"

if [[ "${1:-}" == "--keep" ]]; then
    KEEP_STACK=true
elif [[ -n "${1:-}" ]]; then
    echo "Usage: $0 [--keep]"
    exit 1
fi

export COMPOSE_PROJECT_NAME

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
# Compose wrapper
# ----------------------------------------------------------

compose() {
    docker compose -f "${COMPOSE_FILE}" "$@"
}

# ----------------------------------------------------------
# Temporary environment cleanup
# ----------------------------------------------------------

cleanup() {
    local exit_code=$?

    if [[ "${exit_code}" -ne 0 ]]; then
        echo
        echo "=========================================================="
        echo " Finora Docker Validation FAILED"
        echo "=========================================================="

        echo
        echo "--- Docker Compose status ---"
        compose ps 2>/dev/null || true

        echo
        echo "--- Backend state ---"
        docker inspect "${BACKEND_CONTAINER}" \
            --format 'status={{.State.Status}} health={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
            2>/dev/null || true

        echo
        echo "--- Backend health history ---"
        docker inspect "${BACKEND_CONTAINER}" \
            --format '{{range .State.Health.Log}}{{println "exit=" .ExitCode}}{{println .Output}}{{end}}' \
            2>/dev/null || true

        echo
        echo "--- Backend logs ---"
        docker logs "${BACKEND_CONTAINER}" --tail 250 2>/dev/null || true

        echo
        echo "--- Web state ---"
        docker inspect "${WEB_CONTAINER}" \
            --format 'status={{.State.Status}} health={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
            2>/dev/null || true

        echo
        echo "--- Web logs ---"
        docker logs "${WEB_CONTAINER}" --tail 250 2>/dev/null || true
    fi

    if [[ "${KEEP_STACK}" == false ]]; then
        log "Stopping validation stack..."
        compose down --remove-orphans >/dev/null 2>&1 || true
    fi

    # Never leave credentials on the GitHub runner.
    rm -f "${TEMP_ROOT_ENV}" "${TEMP_BACKEND_ENV}"

    exit "${exit_code}"
}

trap cleanup EXIT

# ==========================================================
# 1. Header
# ==========================================================

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
# 2. Toolchain validation
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

command -v curl >/dev/null 2>&1 || {
    error "curl is required by the Docker validation."
    exit 1
}

command -v python3 >/dev/null 2>&1 || {
    error "python3 is required to parse NEON_DATABASE_URL."
    exit 1
}

success "Docker, Compose, curl and Python are available."

# ==========================================================
# 3. Project structure validation
# ==========================================================

log "Checking required Docker project files..."

required_files=(
    "${COMPOSE_FILE}"
    "scripts/docker.sh"
    "backend/Dockerfile"
    "backend/pyproject.toml"
    "backend/uv.lock"
    "backend/alembic.ini"
    "infrastructure/web/Dockerfile"
    "infrastructure/web/nginx.conf"
    "frontend/package.json"
    "frontend/package-lock.json"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "${file}" ]]; then
        error "Missing required file: ${file}"
        exit 1
    fi
done

success "Docker project structure is valid."

# ==========================================================
# 4. Require Neon connection string
# ==========================================================

log "Checking Neon connection configuration..."

if [[ -z "${NEON_DATABASE_URL:-}" ]]; then
    error "NEON_DATABASE_URL is not set."
    error "Provide the complete Neon PostgreSQL connection string."
    exit 1
fi

case "${NEON_DATABASE_URL}" in
    postgresql://*|postgres://*)
        ;;
    *)
        error "NEON_DATABASE_URL must use postgresql:// or postgres://."
        exit 1
        ;;
esac

if [[ "${NEON_DATABASE_URL}" != *"sslmode=require"* ]]; then
    error "NEON_DATABASE_URL must contain sslmode=require."
    error "Use the Neon connection string with SSL enabled."
    exit 1
fi

success "Neon connection string is configured."

# ==========================================================
# 5. Create temporary environment
# ==========================================================
#
# THIS MUST HAPPEN BEFORE ANY docker compose COMMAND.
#
# compose.yml contains:
#
#   env_file:
#     - ./backend/.env
#
# Therefore backend/.env must physically exist before Compose
# parses the file. Keeping creation here, inside docker.sh,
# guarantees the file exists for config/build/up/exec.
#
# ==========================================================

log "Creating temporary Docker environment..."

# Root .env used by compose.yml for Vite build arguments.
cat > "${TEMP_ROOT_ENV}" <<'EOF'
VITE_API_URL=http://localhost:8000
DEBUG=true
BACKEND_CORS_ORIGINS='["http://localhost","http://localhost:80"]'
EOF

# Parse the single Neon URL into the application's existing
# POSTGRES_* configuration contract.
python3 - "${NEON_DATABASE_URL}" <<'PY'
import sys
from urllib.parse import parse_qs, unquote, urlsplit

url = sys.argv[1]
parsed = urlsplit(url)

if parsed.scheme not in {"postgresql", "postgres"}:
    raise SystemExit("Unsupported PostgreSQL URL scheme.")

if not parsed.hostname:
    raise SystemExit("Neon URL has no hostname.")

if not parsed.username:
    raise SystemExit("Neon URL has no username.")

if parsed.password is None:
    raise SystemExit("Neon URL has no password.")

database = parsed.path.lstrip("/")
if not database:
    raise SystemExit("Neon URL has no database name.")

try:
    port = parsed.port or 5432
except ValueError:
    raise SystemExit("Neon URL has an invalid port.")

query = parse_qs(parsed.query)
sslmode = query.get("sslmode", ["require"])[0]

if sslmode != "require":
    raise SystemExit("Neon connection must use sslmode=require.")

host = parsed.hostname
user = unquote(parsed.username)
password = unquote(parsed.password)
database = unquote(database)

# Docker Compose env_file supports quoted values. Escape single
# quotes so passwords containing them remain valid.
def env_quote(value: str) -> str:
    return "'" + value.replace("'", "'\"'\"'") + "'"

with open("backend/.env", "w", encoding="utf-8") as f:
    f.write("APP_NAME=Finora\n")
    f.write("DEBUG=true\n")
    f.write("DB_TYPE=postgresql\n")
    f.write(f"POSTGRES_HOST={env_quote(host)}\n")
    f.write(f"POSTGRES_PORT={env_quote(str(port))}\n")
    f.write(f"POSTGRES_USER={env_quote(user)}\n")
    f.write(f"POSTGRES_PASSWORD={env_quote(password)}\n")
    f.write(f"POSTGRES_DB={env_quote(database)}\n")
    f.write("POSTGRES_SSLMODE=require\n")
    f.write("SECRET_KEY='finora-docker-validation-secret'\n")
    f.write("ALGORITHM=HS256\n")
    f.write("ACCESS_TOKEN_EXPIRE_MINUTES=60\n")
    f.write('BACKEND_CORS_ORIGINS=\'["http://localhost","http://localhost:80"]\'\n')
PY

chmod 600 "${TEMP_ROOT_ENV}" "${TEMP_BACKEND_ENV}"

if [[ ! -s "${TEMP_BACKEND_ENV}" ]]; then
    error "Temporary backend/.env was not created."
    exit 1
fi

success "Temporary .env created."
success "Temporary backend/.env created."
success "Temporary environment will remain available until cleanup."

# ==========================================================
# 6. Validate Compose definition
# ==========================================================

log "Validating Docker Compose configuration..."

compose config >/dev/null

success "Compose configuration is valid."

services="$(compose config --services)"

if echo "${services}" | grep -qx "postgres"; then
    error "Invalid architecture: postgres service exists."
    error "Finora Docker validation must use external Neon PostgreSQL."
    exit 1
fi

if ! echo "${services}" | grep -qx "backend"; then
    error "backend service is missing from ${COMPOSE_FILE}."
    exit 1
fi

if ! echo "${services}" | grep -qx "web"; then
    error "web service is missing from ${COMPOSE_FILE}."
    exit 1
fi

success "Compose contains backend + web only."
success "No local PostgreSQL service."

# ==========================================================
# 7. Build backend and web images
# ==========================================================

log "Building backend and web images..."

compose build --pull backend web

success "Backend image built."
success "Web image built."

# ==========================================================
# 8. Start backend
# ==========================================================

log "Starting backend container..."

compose up -d backend

success "Backend container started."

# ==========================================================
# 9. Wait for backend health
# ==========================================================

log "Waiting for backend health..."

backend_ready=false

for _ in {1..36}; do
    status="$(docker inspect \
        --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' \
        "${BACKEND_CONTAINER}" 2>/dev/null || true)"

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
    exit 1
fi

success "Backend container is healthy."

# ==========================================================
# 10. Backend HTTP smoke test
# ==========================================================

log "Testing backend health endpoint..."

backend_health="$(curl -fsS --max-time 10 "${BACKEND_HEALTH_URL}")"

if [[ -z "${backend_health}" ]]; then
    error "Backend health endpoint returned an empty response."
    exit 1
fi

success "Backend API responded successfully."
echo "  Response: ${backend_health}"

# ==========================================================
# 11. Neon connectivity from inside backend
# ==========================================================
#
# This proves the actual running backend container can reach
# Neon. A host-side connection test would not prove this.
#
# ==========================================================

log "Testing Neon PostgreSQL from inside backend container..."

docker exec "${BACKEND_CONTAINER}" python - <<'PY'
import os
import sys

try:
    import psycopg2
except ImportError as exc:
    print(f"psycopg2 import failed: {exc}")
    sys.exit(1)

required = (
    "POSTGRES_HOST",
    "POSTGRES_PORT",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_DB",
)

missing = [name for name in required if not os.getenv(name)]

if missing:
    print("Missing backend database variables: " + ", ".join(missing))
    sys.exit(1)

try:
    connection = psycopg2.connect(
        host=os.environ["POSTGRES_HOST"],
        port=os.environ["POSTGRES_PORT"],
        user=os.environ["POSTGRES_USER"],
        password=os.environ["POSTGRES_PASSWORD"],
        dbname=os.environ["POSTGRES_DB"],
        sslmode="require",
        connect_timeout=10,
    )

    with connection.cursor() as cursor:
        cursor.execute("SELECT 1;")
        result = cursor.fetchone()

    connection.close()

    if result != (1,):
        print(f"Unexpected database response: {result}")
        sys.exit(1)

except Exception as exc:
    print(f"Neon PostgreSQL connection failed: {exc}")
    sys.exit(1)

print("Neon PostgreSQL connection successful.")
print("SQL test: SELECT 1 -> 1")
PY

success "Backend container connected successfully to Neon."

# ==========================================================
# 12. Start web
# ==========================================================

log "Starting web container..."

compose up -d web

success "Web container started."

# ==========================================================
# 13. Wait for web health
# ==========================================================

log "Waiting for web health..."

web_ready=false

for _ in {1..24}; do
    status="$(docker inspect \
        --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' \
        "${WEB_CONTAINER}" 2>/dev/null || true)"

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
    exit 1
fi

success "Web container is healthy."

# ==========================================================
# 14. Frontend HTTP smoke test
# ==========================================================

log "Testing frontend..."

frontend_html="$(curl -fsS --max-time 10 "${WEB_URL}")"

if ! grep -qi '<html' <<< "${frontend_html}"; then
    error "Frontend did not return valid HTML."
    exit 1
fi

success "Frontend returned valid HTML."

# ==========================================================
# 15. Nginx health test
# ==========================================================

log "Testing Nginx web health endpoint..."

web_health="$(curl -fsS --max-time 10 "${WEB_HEALTH_URL}")"

if ! grep -qi 'web ok' <<< "${web_health}"; then
    error "Unexpected /web-health response."
    exit 1
fi

success "Nginx health endpoint responded successfully."

# ==========================================================
# 16. Validate compiled Vite API origin
# ==========================================================
#
# VITE_API_URL is the backend ORIGIN:
#
#   http://localhost:8000
#
# client.ts owns the API prefix:
#
#   /api/v1
#
# Therefore the compiled bundle is allowed to contain the
# combined URL "http://localhost:8000/api/v1". That is not
# evidence that VITE_API_URL itself is incorrectly configured.
#
# The previous validation rejected that legitimate compiled
# result and could fail after the complete stack was healthy.
#
# ==========================================================

log "Validating compiled frontend API configuration..."

if ! docker exec "${WEB_CONTAINER}" \
    sh -c "grep -R -F 'http://localhost:8000' /usr/share/nginx/html/assets >/dev/null 2>&1"; then
    error "Compiled frontend does not contain the expected backend origin."
    exit 1
fi

success "Compiled frontend contains the expected backend origin."
success "VITE_API_URL is validated as the backend origin."

# ==========================================================
# 17. Final container validation
# ==========================================================

log "Validating final Docker stack..."

backend_status="$(docker inspect --format '{{.State.Status}}' "${BACKEND_CONTAINER}")"
web_status="$(docker inspect --format '{{.State.Status}}' "${WEB_CONTAINER}")"

if [[ "${backend_status}" != "running" ]]; then
    error "Backend is not running: ${backend_status}"
    exit 1
fi

if [[ "${web_status}" != "running" ]]; then
    error "Web is not running: ${web_status}"
    exit 1
fi

success "Backend and web containers are running."

# ==========================================================
# 18. Final status
# ==========================================================

compose ps

echo
echo "=========================================================="
echo " Finora Docker Stack Validation PASSED"
echo "=========================================================="
echo
echo "✓ Compose configuration validated"
echo "✓ No local PostgreSQL service"
echo "✓ Backend image built"
echo "✓ Web image built"
echo "✓ Backend container healthy"
echo "✓ Backend API responding"
echo "✓ Backend → Neon PostgreSQL verified"
echo "✓ Web container healthy"
echo "✓ Nginx responding"
echo "✓ Frontend HTML served"
echo "✓ Vite API configuration verified"
echo
echo "Database: Neon PostgreSQL"
echo "SSL     : require"
echo

if [[ "${KEEP_STACK}" == true ]]; then
    echo "Docker stack remains running."
    echo "Stop it with:"
    echo "  docker compose -f ${COMPOSE_FILE} down"
else
    echo "Docker validation stack will be stopped automatically."
fi

exit 0
