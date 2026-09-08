#!/usr/bin/env bash

# ============================================================
# Finora — Full Stack Production Deployment
#
# Deployment order:
#
#   Release tag
#        ↓
#   Exact release SHA
#        ↓
#   Render → exact GHCR backend image
#        ↓
#   Backend startup → Alembic → Neon
#        ↓
#   Backend health verification
#        ↓
#   Vercel authentication + project access diagnosis
#        ↓
#   Frontend npm ci + Vite production build
#        ↓
#   Vercel deploy of the already-built dist/ directory
#
# Important:
#   Vercel is NOT asked to run npm ci or npm run build.
#   GitHub Actions performs the frontend build once, then the
#   generated dist/ directory is deployed directly to Vercel.
# ============================================================

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

# ============================================================
# Configuration
# ============================================================

FRONTEND_DIR="${FRONTEND_DIR:-frontend}"
REGISTRY="${REGISTRY:-ghcr.io}"
BACKEND_IMAGE_NAME="${BACKEND_IMAGE_NAME:-finora-backend}"

RENDER_DEPLOY_HOOK_URL="${RENDER_DEPLOY_HOOK_URL:-}"
RENDER_BACKEND_URL="${RENDER_BACKEND_URL:-https://finora-backend-latest.onrender.com}"

VERCEL_TOKEN="${VERCEL_TOKEN:-}"
VERCEL_ORG_ID="${VERCEL_ORG_ID:-}"
VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID:-}"

VITE_API_URL="${VITE_API_URL:-https://finora-backend-latest.onrender.com/api/v1}"

HEALTH_RETRIES="${HEALTH_RETRIES:-30}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-10}"

VERCEL_CLI_VERSION="${VERCEL_CLI_VERSION:-59.11.7}"

EXPECTED_VERCEL_ORG="sabarnaguha1-8647s-projects"
EXPECTED_VERCEL_PROJECT_ID="prj_fujPJ0P1LwIKQJjZO8fAink2H7r4"
EXPECTED_VERCEL_PROJECT_NAME="finora-finance"

# ============================================================
# Helpers
# ============================================================

log() {
    echo
    echo "============================================================"
    echo " $1"
    echo "============================================================"
}

fail() {
    echo
    echo "ERROR: $1"
    exit 1
}

require_command() {
    command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

# ============================================================
# Release metadata
# ============================================================

log "Resolving release metadata"

RELEASE_TAG="$({
    git tag --points-at HEAD --list 'v*.*.*' \
        | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' \
        | head -n 1 || true
})"

[[ -n "${RELEASE_TAG}" ]] || fail \
    "HEAD is not tagged with a semantic release tag (vMAJOR.MINOR.PATCH)."

VERSION="${RELEASE_TAG#v}"

[[ -n "${GITHUB_REPOSITORY_OWNER:-}" ]] || fail \
    "GITHUB_REPOSITORY_OWNER is not set."

BACKEND_IMAGE="${REGISTRY}/${GITHUB_REPOSITORY_OWNER,,}/${BACKEND_IMAGE_NAME}:${VERSION}"

printf 'Release tag:\n  %s\n\n' "${RELEASE_TAG}"
printf 'Version:\n  %s\n\n' "${VERSION}"
printf 'Backend image:\n  %s\n' "${BACKEND_IMAGE}"

# ============================================================
# Required tools / configuration
# ============================================================

log "Validating deployment prerequisites"

require_command git
require_command curl
require_command npm
require_command npx

[[ -n "${RENDER_DEPLOY_HOOK_URL}" ]] || fail \
    "RENDER_DEPLOY_HOOK_URL is not configured."

[[ -n "${RENDER_BACKEND_URL}" ]] || fail \
    "RENDER_BACKEND_URL is not configured."

[[ -n "${VERCEL_TOKEN}" ]] || fail \
    "VERCEL_TOKEN is not configured."

[[ -n "${VERCEL_ORG_ID}" ]] || fail \
    "VERCEL_ORG_ID is not configured."

[[ -n "${VERCEL_PROJECT_ID}" ]] || fail \
    "VERCEL_PROJECT_ID is not configured."

[[ -n "${VITE_API_URL}" ]] || fail \
    "VITE_API_URL is not configured."

# ============================================================
# Exact release SHA verification
# ============================================================

log "Verifying release commit"

CURRENT_SHA="$(git rev-parse HEAD)"
TAG_SHA="$(git rev-list -n 1 "${RELEASE_TAG}")"

printf 'Checked-out SHA:\n  %s\n\n' "${CURRENT_SHA}"
printf 'Release tag SHA:\n  %s\n' "${TAG_SHA}"

[[ "${CURRENT_SHA}" == "${TAG_SHA}" ]] || fail \
    "Checked-out HEAD does not match the release tag."

echo
 echo "[PASS] Exact release tag verified."

# ============================================================
# Stage 1 / 3 — BACKEND
# ============================================================

log "Stage 1 / 3 — BACKEND"

echo "[DEPLOY] Production backend image:"
echo "  ${BACKEND_IMAGE}"
echo

echo "[PASS] Versioned backend image selected."

echo

echo "[DEPLOY] Triggering Render deployment..."

RENDER_RESPONSE_FILE="$(mktemp)"

HTTP_STATUS="$({
    curl \
        --silent \
        --show-error \
        --output "${RENDER_RESPONSE_FILE}" \
        --write-out '%{http_code}' \
        --get \
        --data-urlencode "imgURL=${BACKEND_IMAGE}" \
        "${RENDER_DEPLOY_HOOK_URL}"
} )" || {
    cat "${RENDER_RESPONSE_FILE}" || true
    rm -f "${RENDER_RESPONSE_FILE}"
    fail "Render deploy hook request failed."
}

if [[ "${HTTP_STATUS}" != 2* ]]; then
    cat "${RENDER_RESPONSE_FILE}" || true
    rm -f "${RENDER_RESPONSE_FILE}"
    fail "Render deploy hook failed with HTTP ${HTTP_STATUS}."
fi

cat "${RENDER_RESPONSE_FILE}"
rm -f "${RENDER_RESPONSE_FILE}"

echo
 echo "[PASS] Render deployment triggered."

# ============================================================
# Backend → Neon startup / migration gate
# ============================================================

echo
 echo "[DEPLOY] Waiting for Render backend to become healthy..."

HEALTH_URL="${RENDER_BACKEND_URL%/}/api/v1/health"
BACKEND_READY=false

for ((attempt = 1; attempt <= HEALTH_RETRIES; attempt++)); do
    printf '[%02d/%02d] Checking %s\n' "${attempt}" "${HEALTH_RETRIES}" "${HEALTH_URL}"

    HEALTH_RESPONSE_FILE="$(mktemp)"
    HEALTH_ERROR_FILE="$(mktemp)"

    if curl \
        --silent \
        --show-error \
        --fail \
        --max-time 15 \
        "${HEALTH_URL}" \
        >"${HEALTH_RESPONSE_FILE}" \
        2>"${HEALTH_ERROR_FILE}"
    then
        echo
        echo "[PASS] Backend is healthy."
        echo
        echo "Health response:"
        cat "${HEALTH_RESPONSE_FILE}"
        BACKEND_READY=true
        rm -f "${HEALTH_RESPONSE_FILE}" "${HEALTH_ERROR_FILE}"
        break
    fi

    if [[ -s "${HEALTH_ERROR_FILE}" ]]; then
        echo "  $(cat "${HEALTH_ERROR_FILE}")"
    fi

    rm -f "${HEALTH_RESPONSE_FILE}" "${HEALTH_ERROR_FILE}"

    if (( attempt < HEALTH_RETRIES )); then
        sleep "${HEALTH_INTERVAL}"
    fi
done

[[ "${BACKEND_READY}" == true ]] || fail \
    "Backend did not become healthy. Render startup, image deployment, or Neon migration may have failed."

echo
 echo "[PASS] Backend startup / Neon migration gate passed."

# ============================================================
# Stage 2 / 3 — FRONTEND
# ============================================================

log "Stage 2 / 3 — FRONTEND"

[[ -d "${FRONTEND_DIR}" ]] || fail \
    "Frontend directory not found: ${FRONTEND_DIR}"

[[ -f "${FRONTEND_DIR}/package.json" ]] || fail \
    "${FRONTEND_DIR}/package.json is missing."

[[ -f "${FRONTEND_DIR}/package-lock.json" ]] || fail \
    "${FRONTEND_DIR}/package-lock.json is missing."

[[ -f "${FRONTEND_DIR}/vercel.json" ]] || fail \
    "${FRONTEND_DIR}/vercel.json is missing."

echo "[PASS] Frontend files verified."

# ============================================================
# Vercel authentication + project diagnosis
# ============================================================

echo
echo "[DEPLOY] Diagnosing Vercel authentication and project access..."

echo

echo "Expected Vercel organization:"
echo "  ${EXPECTED_VERCEL_ORG}"
echo
echo "Expected Vercel project:"
echo "  ${EXPECTED_VERCEL_PROJECT_NAME}"
echo
echo "Expected Vercel project ID:"
echo "  ${EXPECTED_VERCEL_PROJECT_ID}"
echo
echo "Configured Org ID length:"
echo "  ${#VERCEL_ORG_ID}"
echo
echo "Configured Project ID length:"
echo "  ${#VERCEL_PROJECT_ID}"
echo
echo "Configured Token length:"
echo "  ${#VERCEL_TOKEN}"

[[ "${VERCEL_ORG_ID}" == "${EXPECTED_VERCEL_ORG}" ]] || fail \
    "VERCEL_ORG_ID does not match the verified Finora Vercel organization."

[[ "${VERCEL_PROJECT_ID}" == "${EXPECTED_VERCEL_PROJECT_ID}" ]] || fail \
    "VERCEL_PROJECT_ID does not match the verified Finora Vercel project."

echo
echo "[PASS] VERCEL_ORG_ID matches."
echo "[PASS] VERCEL_PROJECT_ID matches."

echo
echo "[DEPLOY] Checking Vercel account authentication..."

WHOAMI_OUTPUT="$(
    npx "vercel@${VERCEL_CLI_VERSION}" whoami \
        --token "${VERCEL_TOKEN}" \
        2>&1
)" || {
    echo "${WHOAMI_OUTPUT}"
    fail "Vercel token authentication failed."
}

echo "${WHOAMI_OUTPUT}"
echo
echo "[PASS] Vercel token authentication succeeded."

echo
echo "[DEPLOY] Checking Vercel project access..."

INSPECT_OUTPUT="$(
    npx "vercel@${VERCEL_CLI_VERSION}" project inspect "${EXPECTED_VERCEL_PROJECT_NAME}" \
        --scope "${VERCEL_ORG_ID}" \
        --token "${VERCEL_TOKEN}" \
        --non-interactive \
        2>&1
)" || {
    echo "${INSPECT_OUTPUT}"
    echo
echo "Vercel diagnosis:"
    echo "  Token authentication: passed"
    echo "  Organization ID:       matched"
    echo "  Project ID:            matched"
    echo "  Project access:        FAILED"
    fail "Vercel project access verification failed."
}

echo "${INSPECT_OUTPUT}"
echo
echo "[PASS] Vercel project access verified."

# ============================================================
# Frontend build — GitHub is the build system
# ============================================================

echo
echo "[DEPLOY] Building frontend in GitHub Actions..."

cd "${PROJECT_ROOT}/${FRONTEND_DIR}"

npm ci

export VITE_API_URL
export VITE_APP_VERSION="${VERSION}"

echo
echo "VITE_API_URL:"
echo "  ${VITE_API_URL}"
echo
echo "VITE_APP_VERSION:"
echo "  ${VITE_APP_VERSION}"

echo
echo "[DEPLOY] Running Vite production build..."
npm run build

[[ -d "dist" ]] || fail \
    "Frontend build completed without producing dist/."

[[ -f "dist/index.html" ]] || fail \
    "Frontend build completed without producing dist/index.html."

echo
echo "[PASS] Frontend production build completed."

# ============================================================
# Prepare static Vercel deployment
# ============================================================
#
# IMPORTANT:
# Do not run `vercel build` here.
#
# `vercel build` starts another Vercel-side/local project build and
# can execute the project's npm ci command. That is unnecessary because
# GitHub has already produced the final Vite dist/ artifact.
#
# Copy vercel.json into dist so the SPA rewrite is part of the static
# deployment root. This lets Vercel serve React Router paths through
# index.html without invoking another application build.
# ============================================================

echo
echo "[DEPLOY] Preparing prebuilt static Vercel artifact..."

cp "vercel.json" "dist/vercel.json"

[[ -f "dist/vercel.json" ]] || fail \
    "Failed to copy vercel.json into dist/."

echo "[PASS] Vercel static artifact prepared."

# ============================================================
# Deploy dist/ directly to Vercel
# ============================================================

log "Deploying frontend to Vercel"

cd "${PROJECT_ROOT}/${FRONTEND_DIR}"

VERCEL_ARTIFACT_DIR="$(mktemp -d)"

cleanup_vercel_artifact() {
    rm -rf "${VERCEL_ARTIFACT_DIR}"
}

trap cleanup_vercel_artifact EXIT

cp -R dist/. "${VERCEL_ARTIFACT_DIR}/"

echo "[DEPLOY] Deploying isolated static artifact:"
echo "  ${VERCEL_ARTIFACT_DIR}"

DEPLOY_OUTPUT="$(
    npx "vercel@${VERCEL_CLI_VERSION}" deploy "${VERCEL_ARTIFACT_DIR}" \
        --prod \
        --yes \
        --token "${VERCEL_TOKEN}" \
        --scope "${VERCEL_ORG_ID}" \
        --project "${VERCEL_PROJECT_ID}" \
        2>&1
)" || {
    echo "${DEPLOY_OUTPUT}"
    fail "Vercel production deployment failed."
}

echo "${DEPLOY_OUTPUT}"
echo "${DEPLOY_OUTPUT}"
echo
echo "[PASS] Frontend deployed to Vercel."

# ============================================================
# Stage 3 / 3 — FINAL VERIFICATION
# ============================================================

log "Stage 3 / 3 — FINAL VERIFICATION"

FINAL_HEALTH_URL="${RENDER_BACKEND_URL%/}/api/v1/health"

FINAL_HEALTH_FILE="$(mktemp)"
FINAL_HEALTH_ERROR="$(mktemp)"

if ! curl \
    --silent \
    --show-error \
    --fail \
    --max-time 15 \
    "${FINAL_HEALTH_URL}" \
    >"${FINAL_HEALTH_FILE}" \
    2>"${FINAL_HEALTH_ERROR}"
then
    cat "${FINAL_HEALTH_ERROR}" || true
    rm -f "${FINAL_HEALTH_FILE}" "${FINAL_HEALTH_ERROR}"
    fail "Final backend health verification failed."
fi

echo "Final backend health:"
cat "${FINAL_HEALTH_FILE}"

rm -f "${FINAL_HEALTH_FILE}" "${FINAL_HEALTH_ERROR}"

echo
echo "============================================================"
echo " Finora Production Deployment Successful"
echo "============================================================"
echo
echo "Release:"
echo "  ${RELEASE_TAG}"
echo
echo "Backend:"
echo "  ${BACKEND_IMAGE}"
echo
echo "Database:"
echo "  Neon PostgreSQL"
echo
echo "Backend platform:"
echo "  Render"
echo
echo "Frontend platform:"
echo "  Vercel"
echo
echo "Frontend project:"
echo "  ${EXPECTED_VERCEL_PROJECT_NAME}"
echo
echo "✓ Exact release commit verified"
echo "✓ Versioned backend image selected"
echo "✓ Render deployment triggered"
echo "✓ Backend startup / Neon migration gate passed"
echo "✓ Vercel authentication verified"
echo "✓ Vercel project access verified"
echo "✓ Frontend built in GitHub Actions"
echo "✓ Vercel deployed the built dist/ artifact directly"
echo "✓ Final backend health check passed"
echo
echo "Production deployment complete."
