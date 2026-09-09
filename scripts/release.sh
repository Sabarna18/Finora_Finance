#!/usr/bin/env bash
# ==========================================================
# Finora - Release Publisher
# ==========================================================
#
# Release responsibility:
#
#   1. Build the SAME compose.yml stack used by Docker CI.
#   2. Inject the REAL Neon connection string temporarily.
#   3. Start the freshly built containers with docker compose.
#   4. Validate backend + Neon + web.
#   5. Capture the EXACT image IDs that passed validation.
#   6. Publish those exact images to GHCR.
#
# Deployment is deliberately NOT part of release.
#
# Later deploy.yml will consume:
#
#   ghcr.io/<owner>/finora-backend:<version>
#   ghcr.io/<owner>/finora-web:<version>
#
# No CI database secret is used here.
# CI keeps its own disposable PostgreSQL service.
# Docker/release validation uses NEON_DATABASE_URL.
#
# Usage:
#
#   VERSION=1.0.0 \
#   GHCR_OWNER=myuser \
#   GHCR_USERNAME=myuser \
#   GHCR_TOKEN=... \
#   NEON_DATABASE_URL='postgresql://...' \
#   ./scripts/release.sh
#
# ==========================================================

set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}"

COMPOSE_FILE="${COMPOSE_FILE:-compose.yml}"

VERSION="${VERSION:-}"
GHCR_REGISTRY="${GHCR_REGISTRY:-ghcr.io}"
GHCR_OWNER="${GHCR_OWNER:-}"
GHCR_USERNAME="${GHCR_USERNAME:-}"
GHCR_TOKEN="${GHCR_TOKEN:-}"

NEON_DATABASE_URL="${NEON_DATABASE_URL:-}"
VITE_API_URL="${VITE_API_URL:-http://localhost:8000}"

STACK_STARTED=false
PUBLISHED=false

log() {
    printf '\n→ %s\n' "$1"
}

success() {
    printf '✓ %s\n' "$1"
}

error() {
    printf '✗ %s\n' "$1" >&2
}

cleanup() {
    local rc=$?

    # Environment files are always temporary.
    rm -f \
        "${PROJECT_ROOT}/.env" \
        "${PROJECT_ROOT}/backend/.env"

    if [[ "${STACK_STARTED}" == true ]]; then
        docker compose \
            -f "${COMPOSE_FILE}" \
            down --remove-orphans >/dev/null 2>&1 || true
    fi

    if [[ "${rc}" -ne 0 && "${PUBLISHED}" == false ]]; then
        echo
        echo "=========================================================="
        echo " Finora Release FAILED"
        echo "=========================================================="

        echo
        echo "--- Compose status ---"
        docker compose -f "${COMPOSE_FILE}" ps || true

        echo
        echo "--- Backend logs ---"
        docker logs finora-backend --tail 200 2>/dev/null || true

        echo
        echo "--- Web logs ---"
        docker logs finora-web --tail 200 2>/dev/null || true
    fi

    exit "${rc}"
}

trap cleanup EXIT

echo
echo "=========================================================="
echo " Finora Release"
echo "=========================================================="
echo
echo "Compose : ${COMPOSE_FILE}"
echo "Version : ${VERSION:-<unset>}"
echo "Database: Neon PostgreSQL"
echo "Registry: ${GHCR_REGISTRY}"
echo

# ==========================================================
# 1. Release inputs
# ==========================================================

log "Validating release inputs..."

[[ -f "${COMPOSE_FILE}" ]] ||
    { error "Missing ${COMPOSE_FILE}."; exit 1; }

[[ -n "${VERSION}" ]] ||
    { error "VERSION is required."; exit 1; }

[[ "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] ||
    { error "VERSION must be MAJOR.MINOR.PATCH, e.g. 1.0.0."; exit 1; }

[[ -n "${GHCR_OWNER}" ]] ||
    { error "GHCR_OWNER is required."; exit 1; }

[[ -n "${GHCR_USERNAME}" ]] ||
    { error "GHCR_USERNAME is required."; exit 1; }

[[ -n "${GHCR_TOKEN}" ]] ||
    { error "GHCR_TOKEN is required."; exit 1; }

[[ -n "${NEON_DATABASE_URL}" ]] ||
    { error "NEON_DATABASE_URL is required."; exit 1; }

[[ "${NEON_DATABASE_URL}" == postgres://* ||
   "${NEON_DATABASE_URL}" == postgresql://* ]] ||
    { error "NEON_DATABASE_URL must be a PostgreSQL connection string."; exit 1; }

[[ "${NEON_DATABASE_URL}" == *"sslmode=require"* ]] ||
    { error "NEON_DATABASE_URL must contain sslmode=require."; exit 1; }

# Docker image repository names must be lowercase.
GHCR_OWNER="$(printf '%s' "${GHCR_OWNER}" | tr '[:upper:]' '[:lower:]')"

BACKEND_IMAGE="${GHCR_REGISTRY}/${GHCR_OWNER}/finora-backend"
WEB_IMAGE="${GHCR_REGISTRY}/${GHCR_OWNER}/finora-web"

success "Release inputs are valid."

# ==========================================================
# 2. Docker toolchain
# ==========================================================

log "Checking Docker..."

command -v docker >/dev/null 2>&1 ||
    { error "Docker is not installed."; exit 1; }

docker info >/dev/null 2>&1 ||
    { error "Docker daemon is unavailable."; exit 1; }

docker compose version >/dev/null 2>&1 ||
    { error "Docker Compose is unavailable."; exit 1; }

command -v curl >/dev/null 2>&1 ||
    { error "curl is required."; exit 1; }

command -v python3 >/dev/null 2>&1 ||
    { error "python3 is required."; exit 1; }

success "Docker toolchain is available."

# ==========================================================
# 3. Required project files
# ==========================================================

log "Checking release project structure..."

required_files=(
    "${COMPOSE_FILE}"
    "scripts/release.sh"
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
    [[ -f "${file}" ]] ||
        { error "Missing required file: ${file}."; exit 1; }
done

success "Release project structure is valid."

# ==========================================================
# 4. Compose architecture
# ==========================================================

log "Validating compose.yml..."

# The environment files must exist before Compose is evaluated
# because compose.yml references backend/.env.
cat > "${PROJECT_ROOT}/.env" <<EOF
VITE_API_URL=${VITE_API_URL}
DEBUG=true
BACKEND_CORS_ORIGINS='["http://localhost","http://localhost:80"]'
EOF

python3 - "${NEON_DATABASE_URL}" > "${PROJECT_ROOT}/backend/.env" <<'PY'
import sys
from urllib.parse import urlsplit

url = sys.argv[1]
parts = urlsplit(url)

if parts.scheme not in {"postgres", "postgresql"}:
    raise SystemExit("Invalid PostgreSQL URL scheme.")

if not parts.hostname:
    raise SystemExit("PostgreSQL hostname is missing.")

if not parts.username:
    raise SystemExit("PostgreSQL username is missing.")

if parts.password is None:
    raise SystemExit("PostgreSQL password is missing.")

database = parts.path.lstrip("/")

if not database:
    raise SystemExit("PostgreSQL database name is missing.")

def q(value: str) -> str:
    return "'" + value.replace("'", "'\"'\"'") + "'"

print("APP_NAME=Finora")
print("DEBUG=true")
print("DB_TYPE=postgresql")
print(f"POSTGRES_HOST={q(parts.hostname)}")
print(f"POSTGRES_PORT={parts.port or 5432}")
print(f"POSTGRES_USER={q(parts.username)}")
print(f"POSTGRES_PASSWORD={q(parts.password)}")
print(f"POSTGRES_DB={q(database)}")
print("POSTGRES_SSLMODE=require")
print("SECRET_KEY='finora-release-validation-secret'")
print("ALGORITHM=HS256")
print("ACCESS_TOKEN_EXPIRE_MINUTES=60")
print("BACKEND_CORS_ORIGINS='[\"http://localhost\",\"http://localhost:80\"]'")
PY

chmod 600 \
    "${PROJECT_ROOT}/.env" \
    "${PROJECT_ROOT}/backend/.env"

docker compose -f "${COMPOSE_FILE}" config >/dev/null

services="$(docker compose -f "${COMPOSE_FILE}" config --services)"

grep -qx "backend" <<< "${services}" ||
    { error "backend service is missing."; exit 1; }

grep -qx "web" <<< "${services}" ||
    { error "web service is missing."; exit 1; }

if grep -qx "postgres" <<< "${services}"; then
    error "postgres service must not exist in compose.yml."
    error "Finora uses Neon PostgreSQL."
    exit 1
fi

success "Compose architecture is valid."

# ==========================================================
# 5. Build using canonical compose.yml
# ==========================================================

log "Building release images with docker compose..."

docker compose \
    -f "${COMPOSE_FILE}" \
    build --pull backend web

success "Release images built."

# ==========================================================
# 6. Run the freshly built stack
# ==========================================================

log "Starting freshly built containers..."

docker compose \
    -f "${COMPOSE_FILE}" \
    up -d backend web

STACK_STARTED=true

# ==========================================================
# 7. Backend validation
# ==========================================================

log "Waiting for backend health..."

backend_ready=false

for _ in {1..36}; do
    state="$(
        docker inspect \
            --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' \
            finora-backend 2>/dev/null || true
    )"

    if [[ "${state}" == "healthy" ]]; then
        backend_ready=true
        break
    fi

    if [[ "${state}" == "unhealthy" ]]; then
        break
    fi

    sleep 5
done

[[ "${backend_ready}" == true ]] ||
    { error "Backend did not become healthy."; exit 1; }

success "Backend container is healthy."

log "Testing backend API..."

curl -fsS --max-time 10 \
    http://localhost:8000/api/v1/health >/dev/null

success "Backend health endpoint passed."

# ==========================================================
# 8. Neon validation FROM INSIDE backend
# ==========================================================

log "Testing Neon PostgreSQL from the backend container..."

docker exec finora-backend python - <<'PY'
import os
import sys

try:
    import psycopg2
except ImportError as exc:
    print(f"psycopg2 import failed: {exc}")
    sys.exit(1)

required = {
    "POSTGRES_HOST": os.getenv("POSTGRES_HOST"),
    "POSTGRES_PORT": os.getenv("POSTGRES_PORT"),
    "POSTGRES_USER": os.getenv("POSTGRES_USER"),
    "POSTGRES_PASSWORD": os.getenv("POSTGRES_PASSWORD"),
    "POSTGRES_DB": os.getenv("POSTGRES_DB"),
}

missing = [key for key, value in required.items() if not value]

if missing:
    print("Missing database configuration: " + ", ".join(missing))
    sys.exit(1)

try:
    conn = psycopg2.connect(
        host=required["POSTGRES_HOST"],
        port=required["POSTGRES_PORT"],
        user=required["POSTGRES_USER"],
        password=required["POSTGRES_PASSWORD"],
        dbname=required["POSTGRES_DB"],
        sslmode="require",
        connect_timeout=10,
    )

    with conn.cursor() as cursor:
        cursor.execute("SELECT 1")
        result = cursor.fetchone()

    conn.close()

    if result != (1,):
        print(f"Unexpected SQL result: {result}")
        sys.exit(1)

except Exception as exc:
    print(f"Neon PostgreSQL connection failed: {exc}")
    sys.exit(1)

print("Neon PostgreSQL connection successful.")
print("SQL test: SELECT 1 -> 1")
PY

success "Backend-to-Neon connectivity passed."

# ==========================================================
# 9. Web validation
# ==========================================================

log "Waiting for web health..."

web_ready=false

for _ in {1..24}; do
    state="$(
        docker inspect \
            --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' \
            finora-web 2>/dev/null || true
    )"

    if [[ "${state}" == "healthy" ]]; then
        web_ready=true
        break
    fi

    if [[ "${state}" == "unhealthy" ]]; then
        break
    fi

    sleep 5
done

[[ "${web_ready}" == true ]] ||
    { error "Web did not become healthy."; exit 1; }

success "Web container is healthy."

log "Testing frontend..."

frontend_html="$(curl -fsS --max-time 10 http://localhost/)"

grep -qi '<html' <<< "${frontend_html}" ||
    { error "Frontend did not return HTML."; exit 1; }

success "Frontend HTTP validation passed."

log "Testing Nginx web-health endpoint..."

web_health="$(curl -fsS --max-time 10 http://localhost/web-health)"

grep -qi 'web ok' <<< "${web_health}" ||
    { error "Nginx /web-health validation failed."; exit 1; }

success "Nginx health validation passed."

# ==========================================================
# 10. Capture EXACT validated image IDs
# ==========================================================
#
# IMPORTANT:
#
# The image IDs below are captured AFTER the containers have
# passed validation.
#
# No docker compose build happens after this point.
# Therefore the pushed image is the image that was tested.
#
# ==========================================================

log "Capturing exact validated image IDs..."

BACKEND_ID="$(
    docker compose -f "${COMPOSE_FILE}" images -q backend
)"

WEB_ID="$(
    docker compose -f "${COMPOSE_FILE}" images -q web
)"

[[ -n "${BACKEND_ID}" ]] ||
    { error "Could not determine validated backend image ID."; exit 1; }

[[ -n "${WEB_ID}" ]] ||
    { error "Could not determine validated web image ID."; exit 1; }

success "Exact validated image IDs captured."

# ==========================================================
# 11. GHCR authentication
# ==========================================================

log "Authenticating with GHCR..."

printf '%s' "${GHCR_TOKEN}" |
    docker login "${GHCR_REGISTRY}" \
        --username "${GHCR_USERNAME}" \
        --password-stdin >/dev/null

success "GHCR authentication succeeded."

# ==========================================================
# 12. Tag exact validated images
# ==========================================================

log "Tagging validated images..."

docker tag \
    "${BACKEND_ID}" \
    "${BACKEND_IMAGE}:${VERSION}"

docker tag \
    "${WEB_ID}" \
    "${WEB_IMAGE}:${VERSION}"

# latest is an additional convenience tag.
docker tag \
    "${BACKEND_ID}" \
    "${BACKEND_IMAGE}:latest"

docker tag \
    "${WEB_ID}" \
    "${WEB_IMAGE}:latest"

success "Validated images tagged."

# ==========================================================
# 13. Publish
# ==========================================================

log "Publishing backend ${VERSION}..."

docker push "${BACKEND_IMAGE}:${VERSION}"
docker push "${BACKEND_IMAGE}:latest"

success "Backend images published."

log "Publishing web ${VERSION}..."

docker push "${WEB_IMAGE}:${VERSION}"
docker push "${WEB_IMAGE}:latest"

success "Web images published."

PUBLISHED=true

echo
echo "=========================================================="
echo " Finora Release PASSED"
echo "=========================================================="
echo
echo "Published immutable release:"
echo "  ${BACKEND_IMAGE}:${VERSION}"
echo "  ${WEB_IMAGE}:${VERSION}"
echo
echo "Published convenience tags:"
echo "  ${BACKEND_IMAGE}:latest"
echo "  ${WEB_IMAGE}:latest"
echo
echo "Release guarantee:"
echo "  ✓ compose.yml was used"
echo "  ✓ containers were actually started"
echo "  ✓ backend health passed"
echo "  ✓ Neon SQL connectivity passed"
echo "  ✓ frontend health passed"
echo "  ✓ exact validated image IDs were captured"
echo "  ✓ no rebuild occurred after validation"
echo "  ✓ validated images were published to GHCR"
echo
