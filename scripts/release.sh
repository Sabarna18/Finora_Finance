#!/usr/bin/env bash
# ==========================================================
# Finora - Release Artifact Publisher
#
# Build -> run -> validate -> publish the EXACT images built
# from compose.yml. Deployment is intentionally separate.
#
# Usage:
#   VERSION=1.0.0 \
#   GHCR_OWNER=your-owner \
#   GHCR_USERNAME=your-user \
#   GHCR_TOKEN=your-token \
#   NEON_DATABASE_URL='postgresql://...' \
#   ./scripts/release.sh
#
# Required:
#   VERSION, GHCR_OWNER, GHCR_USERNAME, GHCR_TOKEN,
#   NEON_DATABASE_URL
#
# Optional:
#   GHCR_REGISTRY=ghcr.io
#   VITE_API_URL=http://localhost:8000
#
# ==========================================================

set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-compose.yml}"
GHCR_REGISTRY="${GHCR_REGISTRY:-ghcr.io}"
GHCR_OWNER="${GHCR_OWNER:-}"
GHCR_USERNAME="${GHCR_USERNAME:-}"
GHCR_TOKEN="${GHCR_TOKEN:-}"
VERSION="${VERSION:-}"
NEON_DATABASE_URL="${NEON_DATABASE_URL:-}"
VITE_API_URL="${VITE_API_URL:-http://localhost:8000}"

BACKEND_IMAGE="${GHCR_REGISTRY}/${GHCR_OWNER}/finora-backend"
WEB_IMAGE="${GHCR_REGISTRY}/${GHCR_OWNER}/finora-web"

STACK_STARTED=false
PUBLISHED=false

log() { printf '\n→ %s\n' "$1"; }
ok()  { printf '✓ %s\n' "$1"; }
die() { printf '✗ %s\n' "$1" >&2; exit 1; }

cleanup() {
    local rc=$?
    rm -f "$ROOT/.env" "$ROOT/backend/.env"

    if [[ "$STACK_STARTED" == true ]]; then
        docker compose -f "$COMPOSE_FILE" down --remove-orphans >/dev/null 2>&1 || true
    fi

    if [[ $rc -ne 0 && "$PUBLISHED" == false ]]; then
        echo
        echo "=========================================================="
        echo " Finora Release FAILED"
        echo "=========================================================="
        docker compose -f "$COMPOSE_FILE" ps || true
        docker logs finora-backend --tail 150 2>/dev/null || true
        docker logs finora-web --tail 150 2>/dev/null || true
    fi
    exit "$rc"
}
trap cleanup EXIT

echo
echo "=========================================================="
echo " Finora Release"
echo "=========================================================="
echo

[[ -f "$COMPOSE_FILE" ]] || die "Missing $COMPOSE_FILE."
[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "VERSION must be MAJOR.MINOR.PATCH, e.g. 1.0.0."
[[ -n "$GHCR_OWNER" ]] || die "GHCR_OWNER is required."
[[ -n "$GHCR_USERNAME" ]] || die "GHCR_USERNAME is required."
[[ -n "$GHCR_TOKEN" ]] || die "GHCR_TOKEN is required."
[[ -n "$NEON_DATABASE_URL" ]] || die "NEON_DATABASE_URL is required."
[[ "$NEON_DATABASE_URL" == postgres://* || "$NEON_DATABASE_URL" == postgresql://* ]] || die "Invalid Neon PostgreSQL URL."
[[ "$NEON_DATABASE_URL" == *"sslmode=require"* ]] || die "NEON_DATABASE_URL must contain sslmode=require."

docker info >/dev/null 2>&1 || die "Docker daemon is unavailable."
docker compose version >/dev/null 2>&1 || die "Docker Compose is unavailable."
ok "Release inputs and Docker toolchain are valid."

# ----------------------------------------------------------
# Compose architecture
# ----------------------------------------------------------

log "Validating compose.yml..."

services="$(docker compose -f "$COMPOSE_FILE" config --services)"
grep -qx "backend" <<< "$services" || die "backend service missing."
grep -qx "web" <<< "$services" || die "web service missing."
if grep -qx "postgres" <<< "$services"; then
    die "postgres service must not exist. Finora uses Neon PostgreSQL."
fi
ok "Compose architecture is valid."

# ----------------------------------------------------------
# Temporary environment
# ----------------------------------------------------------

log "Creating temporary release environment..."

cat > "$ROOT/.env" <<EOF
VITE_API_URL=${VITE_API_URL}
DEBUG=true
BACKEND_CORS_ORIGINS='["http://localhost","http://localhost:80"]'
EOF

python3 - "$NEON_DATABASE_URL" > "$ROOT/backend/.env" <<'PY'
import sys
from urllib.parse import urlsplit

p = urlsplit(sys.argv[1])

if p.scheme not in {"postgres", "postgresql"}:
    raise SystemExit("Invalid PostgreSQL scheme.")
if not p.hostname or not p.username or p.password is None:
    raise SystemExit("Incomplete PostgreSQL connection string.")
db = p.path.lstrip("/")
if not db:
    raise SystemExit("Database name is missing.")

def q(v):
    return "'" + v.replace("'", "'\"'\"'") + "'"

print("APP_NAME=Finora")
print("DEBUG=true")
print("DB_TYPE=postgresql")
print(f"POSTGRES_HOST={q(p.hostname)}")
print(f"POSTGRES_PORT={p.port or 5432}")
print(f"POSTGRES_USER={q(p.username)}")
print(f"POSTGRES_PASSWORD={q(p.password)}")
print(f"POSTGRES_DB={q(db)}")
print("POSTGRES_SSLMODE=require")
print("SECRET_KEY='finora-release-validation-secret'")
print("ALGORITHM=HS256")
print("ACCESS_TOKEN_EXPIRE_MINUTES=60")
print("BACKEND_CORS_ORIGINS='[\"http://localhost\",\"http://localhost:80\"]'")
PY

chmod 600 "$ROOT/.env" "$ROOT/backend/.env"
ok "Temporary environment created."

# ----------------------------------------------------------
# Build with the SAME compose.yml used locally
# ----------------------------------------------------------

log "Building release stack with docker compose..."

docker compose -f "$COMPOSE_FILE" config >/dev/null
docker compose -f "$COMPOSE_FILE" build --pull backend web
ok "Backend and web images built."

# ----------------------------------------------------------
# Run freshly built containers
# ----------------------------------------------------------

log "Starting freshly built stack..."

docker compose -f "$COMPOSE_FILE" up -d backend web
STACK_STARTED=true

log "Waiting for backend health..."
for _ in {1..36}; do
    state="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' finora-backend 2>/dev/null || true)"
    [[ "$state" == healthy ]] && break
    [[ "$state" == unhealthy ]] && die "Backend became unhealthy."
    sleep 5
done
[[ "$(docker inspect --format '{{.State.Health.Status}}' finora-backend 2>/dev/null || true)" == healthy ]] || die "Backend did not become healthy."
ok "Backend is healthy."

curl -fsS --max-time 10 http://localhost:8000/api/v1/health >/dev/null
ok "Backend health endpoint passed."

log "Waiting for web health..."
for _ in {1..24}; do
    state="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' finora-web 2>/dev/null || true)"
    [[ "$state" == healthy ]] && break
    [[ "$state" == unhealthy ]] && die "Web became unhealthy."
    sleep 5
done
[[ "$(docker inspect --format '{{.State.Health.Status}}' finora-web 2>/dev/null || true)" == healthy ]] || die "Web did not become healthy."
ok "Web is healthy."

curl -fsS --max-time 10 http://localhost/ | grep -qi '<html' || die "Frontend did not return valid HTML."
curl -fsS --max-time 10 http://localhost/web-health | grep -qi 'web ok' || die "Web health endpoint failed."
ok "Frontend and Nginx validation passed."

# ----------------------------------------------------------
# Capture exact image IDs. No rebuild after this point.
# ----------------------------------------------------------

log "Capturing validated image IDs..."

BACKEND_ID="$(docker compose -f "$COMPOSE_FILE" images -q backend)"
WEB_ID="$(docker compose -f "$COMPOSE_FILE" images -q web)"

[[ -n "$BACKEND_ID" ]] || die "Could not determine backend image ID."
[[ -n "$WEB_ID" ]] || die "Could not determine web image ID."
ok "Validated image IDs captured."

# ----------------------------------------------------------
# Publish exact validated images
# ----------------------------------------------------------

log "Logging in to GHCR..."

printf '%s' "$GHCR_TOKEN" | docker login "$GHCR_REGISTRY" \
    --username "$GHCR_USERNAME" --password-stdin >/dev/null

ok "GHCR authentication succeeded."

log "Tagging validated images..."

docker tag "$BACKEND_ID" "$BACKEND_IMAGE:$VERSION"
docker tag "$BACKEND_ID" "$BACKEND_IMAGE:latest"
docker tag "$WEB_ID" "$WEB_IMAGE:$VERSION"
docker tag "$WEB_ID" "$WEB_IMAGE:latest"

log "Publishing backend..."
docker push "$BACKEND_IMAGE:$VERSION"
docker push "$BACKEND_IMAGE:latest"

log "Publishing web..."
docker push "$WEB_IMAGE:$VERSION"
docker push "$WEB_IMAGE:latest"

PUBLISHED=true

echo
echo "=========================================================="
echo " Finora Release PASSED"
echo "=========================================================="
echo
echo "Published:"
echo "  ${BACKEND_IMAGE}:${VERSION}"
echo "  ${BACKEND_IMAGE}:latest"
echo "  ${WEB_IMAGE}:${VERSION}"
echo "  ${WEB_IMAGE}:latest"
echo
echo "✓ Built with compose.yml"
echo "✓ Started with docker compose"
echo "✓ Backend health passed"
echo "✓ Frontend health passed"
echo "✓ Exact validated images published"
echo
