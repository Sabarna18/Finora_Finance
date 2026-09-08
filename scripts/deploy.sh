#!/usr/bin/env bash

# ============================================================
# Finora - Full Stack Production Deployment
# ============================================================

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

FRONTEND_DIR="${FRONTEND_DIR:-frontend}"
REGISTRY="${REGISTRY:-ghcr.io}"
BACKEND_IMAGE_NAME="${BACKEND_IMAGE_NAME:-finora-backend}"
RENDER_DEPLOY_HOOK_URL="${RENDER_DEPLOY_HOOK_URL:-}"
RENDER_BACKEND_URL="${RENDER_BACKEND_URL:-}"
VERCEL_TOKEN="${VERCEL_TOKEN:-}"
VERCEL_ORG_ID="${VERCEL_ORG_ID:-}"
VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID:-}"
VITE_API_URL="${VITE_API_URL:-}"
HEALTH_RETRIES="${HEALTH_RETRIES:-30}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-10}"

if [[ -t 1 ]]; then
    BLUE='\033[0;34m'
    GREEN='\033[0;32m'
    RED='\033[0;31m'
    YELLOW='\033[1;33m'
    NC='\033[0m'
else
    BLUE=''
    GREEN=''
    RED=''
    YELLOW=''
    NC=''
fi

log() {
    printf '%b\n' "${BLUE}[DEPLOY]${NC} $*"
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

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        error "Required command not found: $1"
        exit 1
    fi
}

require_variable() {
    local name="$1"
    if [[ -z "${!name:-}" ]]; then
        error "Required environment variable is missing: ${name}"
        exit 1
    fi
}

get_release_tag() {
    local tag

    tag="$(
        git tag \
            --points-at HEAD \
            --list 'v*.*.*' \
            | head -n 1
    )"

    if [[ -z "${tag}" ]]; then
        error "No semantic release tag found on checked-out commit."
        git tag --points-at HEAD || true
        exit 1
    fi

    if [[ ! "${tag}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        error "Invalid release tag: ${tag}"
        exit 1
    fi

    printf '%s\n' "${tag}"
}

RELEASE_TAG="$(get_release_tag)"
VERSION="${RELEASE_TAG#v}"

if [[ -z "${GITHUB_REPOSITORY_OWNER:-}" ]]; then
    error "GITHUB_REPOSITORY_OWNER is not available."
    exit 1
fi

GHCR_OWNER="${GITHUB_REPOSITORY_OWNER,,}"
BACKEND_IMAGE="${REGISTRY}/${GHCR_OWNER}/${BACKEND_IMAGE_NAME}:${VERSION}"

printf '\n'
printf '%s\n' '============================================================'
printf '%s\n' ' Finora Full Stack Production Deployment'
printf '%s\n' '============================================================'
printf '\n'

log "Release tag       : ${RELEASE_TAG}"
log "Release version   : ${VERSION}"
log "Release SHA       : $(git rev-parse HEAD)"
log "Backend image     : ${BACKEND_IMAGE}"
log "Render backend    : ${RENDER_BACKEND_URL}"
log "Frontend directory: ${FRONTEND_DIR}"
printf '\n'

require_command git
require_command curl
require_command node
require_command npm
require_command npx

require_variable RENDER_DEPLOY_HOOK_URL
require_variable RENDER_BACKEND_URL
require_variable VERCEL_TOKEN
require_variable VERCEL_ORG_ID
require_variable VERCEL_PROJECT_ID
require_variable VITE_API_URL

log "Verifying release commit..."

if ! git tag \
    --points-at HEAD \
    --list "${RELEASE_TAG}" \
    | grep -Fxq "${RELEASE_TAG}"; then
    error "Checked-out commit does not contain ${RELEASE_TAG}."
    exit 1
fi

success "Exact release tag verified."

printf '\n'
printf '%s\n' '============================================================'
printf '%s\n' ' Stage 1 / 3 - BACKEND'
printf '%s\n' '============================================================'
printf '\n'

log "Production backend image:"
printf '  %s\n' "${BACKEND_IMAGE}"
success "Versioned backend image selected."

log "Triggering Render deployment..."

RENDER_RESPONSE="$(
    curl \
        --fail \
        --silent \
        --show-error \
        --max-time 30 \
        --get \
        --data-urlencode "imgURL=${BACKEND_IMAGE}" \
        "${RENDER_DEPLOY_HOOK_URL}"
)"

printf '%s\n' "${RENDER_RESPONSE}"
success "Render deployment triggered."

printf '\n'
log "Waiting for Render backend to become healthy..."

HEALTH_URL="${RENDER_BACKEND_URL%/}/api/v1/health"
backend_ready=false

for ((attempt=1; attempt<=HEALTH_RETRIES; attempt++)); do
    printf '[%02d/%02d] Checking %s\n' \
        "${attempt}" \
        "${HEALTH_RETRIES}" \
        "${HEALTH_URL}"

    if curl \
        --fail \
        --silent \
        --show-error \
        --max-time 15 \
        "${HEALTH_URL}" \
        >/dev/null; then
        backend_ready=true
        break
    fi

    if (( attempt < HEALTH_RETRIES )); then
        sleep "${HEALTH_INTERVAL}"
    fi
done

if [[ "${backend_ready}" != true ]]; then
    error "Render backend did not become healthy."
    error "Health URL: ${HEALTH_URL}"
    exit 1
fi

success "Render backend health check passed."
log "Production backend is responding."
success "Backend-to-Neon production startup gate passed."

printf '\n'
printf '%s\n' '============================================================'
printf '%s\n' ' Stage 2 / 3 - FRONTEND'
printf '%s\n' '============================================================'
printf '\n'

if [[ ! -d "${FRONTEND_DIR}" ]]; then
    error "Frontend directory not found: ${FRONTEND_DIR}"
    exit 1
fi

if [[ ! -f "${FRONTEND_DIR}/package.json" ]]; then
    error "Frontend package.json not found."
    exit 1
fi

if [[ ! -f "${FRONTEND_DIR}/package-lock.json" ]]; then
    error "Frontend package-lock.json not found."
    exit 1
fi

if [[ ! -f "${FRONTEND_DIR}/vercel.json" ]]; then
    error "frontend/vercel.json is missing."
    error "Production SPA routing configuration is required."
    exit 1
fi

success "Frontend deployment configuration verified."

log "Installing frontend dependencies..."
cd "${FRONTEND_DIR}"
npm ci
success "Frontend dependencies installed."

export VITE_API_URL
export VITE_APP_VERSION="${VERSION}"

log "VITE_API_URL     : ${VITE_API_URL}"
log "VITE_APP_VERSION : ${VITE_APP_VERSION}"

log "Building frontend..."
npm run build
success "Frontend production build completed."

log "Creating Vercel production build..."
npx vercel build \
    --prod \
    --yes \
    --token "${VERCEL_TOKEN}" \
    --scope "${VERCEL_ORG_ID}" \
    --project "${VERCEL_PROJECT_ID}"
success "Vercel production build completed."

log "Deploying frontend to Vercel production..."

DEPLOY_OUTPUT="$(
    npx vercel deploy \
        --prebuilt \
        --prod \
        --yes \
        --token "${VERCEL_TOKEN}" \
        --scope "${VERCEL_ORG_ID}" \
        --project "${VERCEL_PROJECT_ID}" \
        2>&1
)"

printf '%s\n' "${DEPLOY_OUTPUT}"
success "Frontend deployment completed."

printf '\n'
printf '%s\n' '============================================================'
printf '%s\n' ' Stage 3 / 3 - PRODUCTION VERIFICATION'
printf '%s\n' '============================================================'
printf '\n'

log "Verifying production backend..."

if curl \
    --fail \
    --silent \
    --show-error \
    --max-time 20 \
    "${HEALTH_URL}" \
    >/dev/null; then
    success "Production backend is healthy."
else
    error "Production backend health verification failed."
    exit 1
fi

printf '\n'
printf '%s\n' '============================================================'
printf '%s\n' ' Finora Full Stack Deployment Complete'
printf '%s\n' '============================================================'
printf '\n'

printf 'Release:\n'
printf '  Tag       : %s\n' "${RELEASE_TAG}"
printf '  Version   : %s\n' "${VERSION}"
printf '  SHA       : %s\n' "$(git rev-parse HEAD)"
printf '\n'
printf 'Backend:\n'
printf '  Image     : %s\n' "${BACKEND_IMAGE}"
printf '  Platform  : Render\n'
printf '  Database  : Neon PostgreSQL\n'
printf '  Health    : %s\n' "${HEALTH_URL}"
printf '\n'
printf 'Frontend:\n'
printf '  Platform  : Vercel\n'
printf '  API URL   : %s\n' "${VITE_API_URL}"
printf '  Version   : %s\n' "${VITE_APP_VERSION}"
printf '\n'
printf '%s\n' '============================================================'
printf '%s\n' ' Production deployment successful'
printf '%s\n' '============================================================'
printf '\n'
