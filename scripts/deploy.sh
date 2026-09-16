#!/usr/bin/env bash

# ============================================================
# Finora — Production Deployment
# ============================================================
#
# Deployment architecture:
#
#   Git release tag
#        │
#        ├── GHCR versioned backend image
#        │        ↓
#        │      Render
#        │
#        ├── React source at exact release commit
#        │        ↓
#        │      Vercel
#        │
#        └── Neon PostgreSQL
#                 ↑
#              Render runtime
#
# IMPORTANT:
#
# - Render receives the IMMUTABLE versioned backend image.
# - Vercel builds the frontend from the exact release commit.
# - Neon is an external managed PostgreSQL database.
# - No local PostgreSQL is started by this script.
# - No "latest" image is used for production backend deployment.
#
# ============================================================

set -Eeuo pipefail


# ============================================================
# PATHS
# ============================================================

SCRIPT_DIR="$(
    cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &&
    pwd
)"

PROJECT_ROOT="$(
    cd -- "${SCRIPT_DIR}/.." &&
    pwd
)"

cd "${PROJECT_ROOT}"


# ============================================================
# CONFIGURATION
# ============================================================

FRONTEND_DIR="${FRONTEND_DIR:-frontend}"

REGISTRY="${REGISTRY:-ghcr.io}"

BACKEND_IMAGE_NAME="${BACKEND_IMAGE_NAME:-finora-backend}"

RENDER_DEPLOY_HOOK_URL="${RENDER_DEPLOY_HOOK_URL:-}"

RENDER_BACKEND_URL="${RENDER_BACKEND_URL:-https://finora-backend-latest.onrender.com}"

VERCEL_TOKEN="${VERCEL_TOKEN:-}"

VERCEL_ORG_ID="${VERCEL_ORG_ID:-}"

VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID:-}"

VITE_API_URL="${VITE_API_URL:-${RENDER_BACKEND_URL%/}/api/v1}"

HEALTH_RETRIES="${HEALTH_RETRIES:-30}"

HEALTH_INTERVAL="${HEALTH_INTERVAL:-10}"

VERCEL_CLI_VERSION="${VERCEL_CLI_VERSION:-59.11.7}"


# ============================================================
# VERIFIED VERCEL PROJECT
# ============================================================

EXPECTED_VERCEL_ORG="${EXPECTED_VERCEL_ORG:-sabarnaguha1-8647s-projects}"

EXPECTED_VERCEL_PROJECT_ID="${EXPECTED_VERCEL_PROJECT_ID:-prj_fujPJ0P1LwIKQJjZO8fAink2H7r4}"

EXPECTED_VERCEL_PROJECT_NAME="${EXPECTED_VERCEL_PROJECT_NAME:-finora-finance}"


# ============================================================
# TEMP FILES
# ============================================================

TMP_FILES=()


cleanup() {

    for file in "${TMP_FILES[@]:-}"; do

        [[ -n "${file}" ]] &&
            rm -f -- "${file}" 2>/dev/null || true

    done

}

trap cleanup EXIT


# ============================================================
# LOGGING
# ============================================================

log() {

    echo
    echo "============================================================"
    echo " $1"
    echo "============================================================"

}


info() {

    echo "[INFO] $1"

}


success() {

    echo "[PASS] $1"

}


warn() {

    echo "[WARN] $1"

}


fail() {

    echo
    echo "============================================================"
    echo " Finora Production Deployment FAILED"
    echo "============================================================"
    echo
    echo "[ERROR] $1"
    echo

    exit 1

}


require_command() {

    command -v "$1" >/dev/null 2>&1 ||
        fail "Required command not found: $1"

}


# ============================================================
# RELEASE METADATA
# ============================================================

log "Resolving Release Metadata"


RELEASE_TAG="$(
    git tag --points-at HEAD --list 'v*.*.*' |
        grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' |
        head -n 1 ||
        true
)"


[[ -n "${RELEASE_TAG}" ]] ||
    fail \
        "HEAD is not tagged with a semantic release tag (vMAJOR.MINOR.PATCH)."


VERSION="${RELEASE_TAG#v}"


[[ "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] ||
    fail \
        "Invalid release version: ${VERSION}"


[[ -n "${GITHUB_REPOSITORY_OWNER:-}" ]] ||
    fail \
        "GITHUB_REPOSITORY_OWNER is not set."


BACKEND_IMAGE="${REGISTRY}/${GITHUB_REPOSITORY_OWNER,,}/${BACKEND_IMAGE_NAME}:${VERSION}"


echo
echo "Release tag:"
echo "  ${RELEASE_TAG}"
echo
echo "Application version:"
echo "  ${VERSION}"
echo
echo "Backend image:"
echo "  ${BACKEND_IMAGE}"


# ============================================================
# DEPLOYMENT PREREQUISITES
# ============================================================

log "Validating Deployment Prerequisites"


require_command git
require_command curl
require_command npm
require_command npx


[[ -n "${RENDER_DEPLOY_HOOK_URL}" ]] ||
    fail \
        "RENDER_DEPLOY_HOOK_URL is not configured."


[[ -n "${RENDER_BACKEND_URL}" ]] ||
    fail \
        "RENDER_BACKEND_URL is not configured."


[[ -n "${VERCEL_TOKEN}" ]] ||
    fail \
        "VERCEL_TOKEN is not configured."


[[ -n "${VERCEL_ORG_ID}" ]] ||
    fail \
        "VERCEL_ORG_ID is not configured."


[[ -n "${VERCEL_PROJECT_ID}" ]] ||
    fail \
        "VERCEL_PROJECT_ID is not configured."


[[ -n "${VITE_API_URL}" ]] ||
    fail \
        "VITE_API_URL is not configured."


success "Deployment prerequisites are present."


# ============================================================
# RELEASE COMMIT VERIFICATION
# ============================================================

log "Verifying Exact Release Commit"


CURRENT_SHA="$(git rev-parse HEAD)"

TAG_SHA="$(
    git rev-list \
        -n 1 \
        "${RELEASE_TAG}"
)"


echo
echo "Checked-out SHA:"
echo "  ${CURRENT_SHA}"

echo
echo "Release tag SHA:"
echo "  ${TAG_SHA}"


[[ "${CURRENT_SHA}" == "${TAG_SHA}" ]] ||
    fail \
        "Checked-out HEAD does not match ${RELEASE_TAG}."


success "Exact release commit verified."


# ============================================================
# RELEASE IMAGE
# ============================================================

log "Resolving Production Backend Image"


echo
echo "Render will deploy:"
echo "  ${BACKEND_IMAGE}"
echo
echo "Production image policy:"
echo "  ✓ Versioned image"
echo "  ✓ Immutable release"
echo "  ✗ latest tag"


success "Production backend image selected."


# ============================================================
# STAGE 1 / 3 — RENDER BACKEND
# ============================================================

log "Stage 1 / 3 — Render Backend"


info "Triggering Render deployment..."


RENDER_RESPONSE_FILE="$(
    mktemp
)"

TMP_FILES+=(
    "${RENDER_RESPONSE_FILE}"
)


HTTP_STATUS="$(
    curl \
        --silent \
        --show-error \
        --output "${RENDER_RESPONSE_FILE}" \
        --write-out '%{http_code}' \
        --get \
        --data-urlencode "imgURL=${BACKEND_IMAGE}" \
        "${RENDER_DEPLOY_HOOK_URL}"
)"


if [[ "${HTTP_STATUS}" != "2"* ]]; then

    echo
    echo "Render response:"
    cat "${RENDER_RESPONSE_FILE}" || true
    echo

    fail \
        "Render deploy hook failed with HTTP ${HTTP_STATUS}."

fi


success \
    "Render deployment triggered successfully (HTTP ${HTTP_STATUS})."


# ============================================================
# WAIT FOR RENDER + NEON
# ============================================================

log "Waiting for Render Backend + Neon"


HEALTH_URL="${RENDER_BACKEND_URL%/}/api/v1/health"

BACKEND_READY=false


echo
echo "Health endpoint:"
echo "  ${HEALTH_URL}"
echo
echo "Maximum attempts:"
echo "  ${HEALTH_RETRIES}"
echo
echo "Interval:"
echo "  ${HEALTH_INTERVAL}s"


for (
    (
        attempt=1
    );

    attempt<=HEALTH_RETRIES;

    attempt++
); do


    echo
    echo "[HEALTH] Attempt ${attempt}/${HEALTH_RETRIES}"


    HEALTH_RESPONSE_FILE="$(
        mktemp
    )"

    HEALTH_ERROR_FILE="$(
        mktemp
    )"


    TMP_FILES+=(
        "${HEALTH_RESPONSE_FILE}"
        "${HEALTH_ERROR_FILE}"
    )


    if curl \
        --silent \
        --show-error \
        --fail \
        --max-time 15 \
        "${HEALTH_URL}" \
        >"${HEALTH_RESPONSE_FILE}" \
        2>"${HEALTH_ERROR_FILE}"; then


        echo
        echo "Backend response:"
        cat "${HEALTH_RESPONSE_FILE}"

        echo

        BACKEND_READY=true

        break

    fi


    if [[ -s "${HEALTH_ERROR_FILE}" ]]; then

        echo "  $(cat "${HEALTH_ERROR_FILE}")"

    else

        echo "  Backend not ready yet."

    fi


    if (( attempt < HEALTH_RETRIES )); then

        echo "  Waiting ${HEALTH_INTERVAL}s..."

        sleep "${HEALTH_INTERVAL}"

    fi


done


[[ "${BACKEND_READY}" == true ]] ||
    fail \
        "Render backend did not become healthy. Render startup, image deployment, or Neon migration may have failed."


success "Render backend startup gate passed."

success "Neon migration/startup gate passed."


# ============================================================
# STAGE 2 / 3 — VERCEL VALIDATION
# ============================================================

log "Stage 2 / 3 — Vercel Frontend"


info "Validating frontend source..."


[[ -d "${FRONTEND_DIR}" ]] ||
    fail \
        "Frontend directory not found: ${FRONTEND_DIR}"


[[ -f "${FRONTEND_DIR}/package.json" ]] ||
    fail \
        "frontend/package.json is missing."


[[ -f "${FRONTEND_DIR}/package-lock.json" ]] ||
    fail \
        "frontend/package-lock.json is missing."


[[ -f "${FRONTEND_DIR}/vercel.json" ]] ||
    fail \
        "frontend/vercel.json is missing."


success "Frontend project structure verified."


# ============================================================
# VERCEL ORGANIZATION / PROJECT VALIDATION
# ============================================================

log "Validating Vercel Project"


echo
echo "Expected Vercel organization:"
echo "  ${EXPECTED_VERCEL_ORG}"

echo
echo "Expected Vercel project:"
echo "  ${EXPECTED_VERCEL_PROJECT_NAME}"

echo
echo "Expected Vercel project ID:"
echo "  ${EXPECTED_VERCEL_PROJECT_ID}"


[[ "${VERCEL_ORG_ID}" == "${EXPECTED_VERCEL_ORG}" ]] ||
    fail \
        "VERCEL_ORG_ID does not match the verified Finora Vercel organization."


[[ "${VERCEL_PROJECT_ID}" == "${EXPECTED_VERCEL_PROJECT_ID}" ]] ||
    fail \
        "VERCEL_PROJECT_ID does not match the verified Finora Vercel project."


success "Vercel organization and project IDs verified."


# ============================================================
# VERCEL AUTHENTICATION
# ============================================================

log "Checking Vercel Authentication"


WHOAMI_OUTPUT="$(
    npx \
        --yes \
        "vercel@${VERCEL_CLI_VERSION}" \
        whoami \
        --token "${VERCEL_TOKEN}" \
        2>&1
)" || {

    echo "${WHOAMI_OUTPUT}"

    fail \
        "Vercel token authentication failed."

}


echo
echo "${WHOAMI_OUTPUT}"

success "Vercel token authentication succeeded."


# ============================================================
# VERCEL PROJECT ACCESS
# ============================================================

log "Checking Vercel Project Access"


PROJECT_INSPECT_OUTPUT="$(
    npx \
        --yes \
        "vercel@${VERCEL_CLI_VERSION}" \
        project inspect "${EXPECTED_VERCEL_PROJECT_NAME}" \
        --token "${VERCEL_TOKEN}" \
        --scope "${VERCEL_ORG_ID}" \
        2>&1
)" || {

    echo "${PROJECT_INSPECT_OUTPUT}"

    fail \
        "Unable to inspect the verified Vercel project."

}


echo
echo "${PROJECT_INSPECT_OUTPUT}"

success "Vercel project access verified."


# ============================================================
# FRONTEND BUILD
# ============================================================

log "Building Frontend Production Artifact"


cd "${PROJECT_ROOT}/${FRONTEND_DIR}"


info "Installing locked frontend dependencies..."

npm ci


success "Frontend dependencies installed."


export VITE_API_URL

export VITE_APP_VERSION="${VERSION}"


echo
echo "Frontend API URL:"
echo "  ${VITE_API_URL}"

echo
echo "Frontend application version:"
echo "  ${VITE_APP_VERSION}"


info "Running production frontend build..."


npm run build


[[ -d "dist" ]] ||
    fail \
        "Frontend build completed without producing dist/."


success "Frontend production build succeeded."


cd "${PROJECT_ROOT}"


# ============================================================
# VERCEL PRODUCTION BUILD
# ============================================================

log "Preparing Vercel Production Build"


npx \
    --yes \
    "vercel@${VERCEL_CLI_VERSION}" \
    build \
    --prod \
    --yes \
    --token "${VERCEL_TOKEN}" \
    --scope "${VERCEL_ORG_ID}" \
    --project "${VERCEL_PROJECT_ID}"


success "Vercel production build prepared."


# ============================================================
# VERCEL DEPLOYMENT
# ============================================================

log "Deploying Frontend to Vercel"


DEPLOY_OUTPUT="$(
    npx \
        --yes \
        "vercel@${VERCEL_CLI_VERSION}" \
        deploy \
        --prebuilt \
        --prod \
        --yes \
        --token "${VERCEL_TOKEN}" \
        --scope "${VERCEL_ORG_ID}" \
        --project "${VERCEL_PROJECT_ID}" \
        2>&1
)" || {

    echo "${DEPLOY_OUTPUT}"

    fail \
        "Vercel production deployment failed."

}


echo
echo "${DEPLOY_OUTPUT}"


success "Frontend deployed to Vercel."


# ============================================================
# EXTRACT VERCEL DEPLOYMENT URL
# ============================================================

VERCEL_DEPLOYMENT_URL="$(
    printf '%s\n' "${DEPLOY_OUTPUT}" |
        grep -Eo 'https://[^[:space:]]+\.vercel\.app' |
        tail -n 1 ||
        true
)


if [[ -n "${VERCEL_DEPLOYMENT_URL}" ]]; then

    echo
    echo "Vercel deployment URL:"
    echo "  ${VERCEL_DEPLOYMENT_URL}"

else

    warn \
        "Vercel CLI did not expose a vercel.app deployment URL."

fi


# ============================================================
# STAGE 3 / 3 — FINAL PRODUCTION VERIFICATION
# ============================================================

log "Stage 3 / 3 — Final Production Verification"


# ============================================================
# BACKEND FINAL HEALTH
# ============================================================

info "Checking production backend one final time..."


FINAL_HEALTH_FILE="$(
    mktemp
)"

TMP_FILES+=(
    "${FINAL_HEALTH_FILE}"
)


curl \
    --silent \
    --show-error \
    --fail \
    --max-time 15 \
    "${HEALTH_URL}" \
    >"${FINAL_HEALTH_FILE}" ||
    fail \
        "Final Render backend health check failed."


echo
echo "Backend health response:"
cat "${FINAL_HEALTH_FILE}"


success "Final backend health check passed."


# ============================================================
# FRONTEND FINAL HTTP CHECK
# ============================================================

if [[ -n "${VERCEL_DEPLOYMENT_URL}" ]]; then

    info "Checking deployed Vercel frontend..."

    curl \
        --silent \
        --show-error \
        --fail \
        --max-time 20 \
        --location \
        "${VERCEL_DEPLOYMENT_URL}" \
        >/dev/null ||
        fail \
            "Vercel frontend HTTP verification failed."


    success "Vercel frontend HTTP check passed."

else

    warn \
        "Frontend HTTP verification skipped because deployment URL was not returned by Vercel CLI."

fi


# ============================================================
# FINAL SUMMARY
# ============================================================

echo
echo "============================================================"
echo " Finora Production Deployment Successful"
echo "============================================================"
echo

echo "Release:"
echo "  ${RELEASE_TAG}"

echo

echo "Application version:"
echo "  ${VERSION}"

echo

echo "Backend:"
echo "  ${BACKEND_IMAGE}"

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

echo "Database:"
echo "  Neon PostgreSQL"

echo

echo "API:"
echo "  ${VITE_API_URL}"

if [[ -n "${VERCEL_DEPLOYMENT_URL}" ]]; then

    echo
    echo "Frontend deployment:"
    echo "  ${VERCEL_DEPLOYMENT_URL}"

fi

echo
echo "Deployment gates:"
echo "  ✓ Exact release tag verified"
echo "  ✓ Versioned GHCR backend image selected"
echo "  ✓ Render deployment triggered"
echo "  ✓ Render backend became healthy"
echo "  ✓ Neon startup/migration gate passed"
echo "  ✓ Vercel authentication verified"
echo "  ✓ Vercel project access verified"
echo "  ✓ Frontend dependencies installed"
echo "  ✓ Frontend production build passed"
echo "  ✓ Vercel production deployment passed"
echo "  ✓ Final backend health check passed"

if [[ -n "${VERCEL_DEPLOYMENT_URL}" ]]; then

    echo "  ✓ Final frontend HTTP check passed"

fi

echo
echo "============================================================"
echo " Finora Release ${VERSION} — DEPLOYED"
echo "============================================================"
echo
