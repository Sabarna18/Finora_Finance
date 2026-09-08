#!/usr/bin/env bash
set -Eeuo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"
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
log(){ echo; echo "============================================================"; echo " $1"; echo "============================================================"; }
fail(){ echo; echo "ERROR: $1"; exit 1; }
require_command(){ command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"; }
log "Resolving release metadata"
RELEASE_TAG="$(git tag --points-at HEAD --list 'v*.*.*' | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -n 1 || true)"
[[ -n "${RELEASE_TAG}" ]] || fail "HEAD is not tagged with a semantic release tag (vMAJOR.MINOR.PATCH)."
VERSION="${RELEASE_TAG#v}"
BACKEND_IMAGE="${REGISTRY}/${GITHUB_REPOSITORY_OWNER,,}/${BACKEND_IMAGE_NAME}:${VERSION}"
echo "Release tag: ${RELEASE_TAG}"; echo "Version: ${VERSION}"; echo "Backend image: ${BACKEND_IMAGE}"
log "Validating deployment prerequisites"
require_command git; require_command curl; require_command npm; require_command npx
[[ -n "${GITHUB_REPOSITORY_OWNER:-}" ]] || fail "GITHUB_REPOSITORY_OWNER is not set."
[[ -n "${RENDER_DEPLOY_HOOK_URL}" ]] || fail "RENDER_DEPLOY_HOOK_URL is not configured."
[[ -n "${RENDER_BACKEND_URL}" ]] || fail "RENDER_BACKEND_URL is not configured."
[[ -n "${VERCEL_TOKEN}" ]] || fail "VERCEL_TOKEN is not configured."
[[ -n "${VERCEL_ORG_ID}" ]] || fail "VERCEL_ORG_ID is not configured."
[[ -n "${VERCEL_PROJECT_ID}" ]] || fail "VERCEL_PROJECT_ID is not configured."
[[ -n "${VITE_API_URL}" ]] || fail "VITE_API_URL is not configured."
log "Verifying release commit"
CURRENT_SHA="$(git rev-parse HEAD)"; TAG_SHA="$(git rev-list -n 1 "${RELEASE_TAG}")"
echo "Checked-out SHA: ${CURRENT_SHA}"; echo "Release tag SHA: ${TAG_SHA}"
[[ "${CURRENT_SHA}" == "${TAG_SHA}" ]] || fail "Checked-out HEAD does not match the release tag."
echo "✓ Release commit verified."
log "Triggering Render backend deployment"
HTTP_STATUS="$(curl --silent --show-error --output /tmp/finora-render-deploy-response.txt --write-out '%{http_code}' --get --data-urlencode "imgURL=${BACKEND_IMAGE}" "${RENDER_DEPLOY_HOOK_URL}")"
if [[ "${HTTP_STATUS}" != "2"* ]]; then cat /tmp/finora-render-deploy-response.txt || true; rm -f /tmp/finora-render-deploy-response.txt; fail "Render deploy hook failed with HTTP ${HTTP_STATUS}."; fi
rm -f /tmp/finora-render-deploy-response.txt; echo "✓ Render deployment triggered (HTTP ${HTTP_STATUS})."
log "Waiting for backend startup and Neon migration"
HEALTH_URL="${RENDER_BACKEND_URL%/}/api/v1/health"; BACKEND_READY=false
for ((attempt=1; attempt<=HEALTH_RETRIES; attempt++)); do
  echo "Health check ${attempt}/${HEALTH_RETRIES}..."
  if curl --silent --show-error --fail --max-time 15 "${HEALTH_URL}" >/tmp/finora-health-response.txt 2>/tmp/finora-health-error.txt; then
    echo "✓ Backend is healthy."; cat /tmp/finora-health-response.txt; BACKEND_READY=true; break
  fi
  [[ -s /tmp/finora-health-error.txt ]] && echo "  $(cat /tmp/finora-health-error.txt)"
  (( attempt < HEALTH_RETRIES )) && sleep "${HEALTH_INTERVAL}"
done
rm -f /tmp/finora-health-response.txt /tmp/finora-health-error.txt
[[ "${BACKEND_READY}" == true ]] || fail "Backend did not become healthy. Render startup, image deployment, or Neon migration may have failed."
echo "✓ Backend startup gate passed."
log "Validating frontend"
[[ -d "${FRONTEND_DIR}" ]] || fail "Frontend directory not found: ${FRONTEND_DIR}"
[[ -f "${FRONTEND_DIR}/package.json" ]] || fail "frontend/package.json is missing."
[[ -f "${FRONTEND_DIR}/package-lock.json" ]] || fail "frontend/package-lock.json is missing."
[[ -f "${FRONTEND_DIR}/vercel.json" ]] || fail "frontend/vercel.json is missing."
echo "✓ Frontend files verified."
log "Diagnosing Vercel authentication and project access"
EXPECTED_ORG="sabarnaguha1-8647s-projects"
EXPECTED_PROJECT_ID="prj_fujPJ0P1LwIKQJjZO8fAink2H7r4"
echo "Expected Vercel organization: ${EXPECTED_ORG}"; echo "Expected Vercel project: finora-finance"; echo "Expected Vercel project ID: ${EXPECTED_PROJECT_ID}"
echo "Configured Org ID length: ${#VERCEL_ORG_ID}"; echo "Configured Project ID length: ${#VERCEL_PROJECT_ID}"; echo "Configured Token length: ${#VERCEL_TOKEN}"
[[ "${VERCEL_ORG_ID}" == "${EXPECTED_ORG}" ]] || fail "VERCEL_ORG_ID does not match the verified Finora Vercel organization."
[[ "${VERCEL_PROJECT_ID}" == "${EXPECTED_PROJECT_ID}" ]] || fail "VERCEL_PROJECT_ID does not match the verified Finora Vercel project."
echo "✓ VERCEL_ORG_ID matches. ✓ VERCEL_PROJECT_ID matches."
echo; echo "Checking Vercel account authentication..."
WHOAMI_OUTPUT="$(npx vercel whoami --token "${VERCEL_TOKEN}" 2>&1)" || { echo "${WHOAMI_OUTPUT}"; fail "Vercel token authentication failed."; }
echo "${WHOAMI_OUTPUT}"; echo "✓ Vercel token authentication succeeded."
echo; echo "Checking Vercel project access..."
INSPECT_OUTPUT="$(npx vercel project inspect finora-finance --scope "${VERCEL_ORG_ID}" --token "${VERCEL_TOKEN}" --non-interactive 2>&1)" || {
  echo "${INSPECT_OUTPUT}"; echo; echo "Vercel diagnosis:"; echo "  Token authentication: passed"; echo "  Organization ID:       matched"; echo "  Project ID:            matched"; echo "  Project access:        FAILED"; fail "Vercel project access verification failed."; }
echo "${INSPECT_OUTPUT}"; echo "✓ Vercel project access verified."
log "Building frontend"
cd "${PROJECT_ROOT}/${FRONTEND_DIR}"
npm ci
export VITE_API_URL
export VITE_APP_VERSION="${VERSION}"
echo "VITE_API_URL: ${VITE_API_URL}"; echo "VITE_APP_VERSION: ${VITE_APP_VERSION}"
npm run build
[[ -d dist ]] || fail "Frontend build completed without producing dist/."
echo "✓ Frontend production build succeeded."
log "Preparing Vercel production deployment"
npx vercel build --prod --yes --token "${VERCEL_TOKEN}" --scope "${VERCEL_ORG_ID}" --project "${VERCEL_PROJECT_ID}"
echo "✓ Vercel production build prepared."
log "Deploying frontend to Vercel"
DEPLOY_OUTPUT="$(npx vercel deploy --prebuilt --prod --yes --token "${VERCEL_TOKEN}" --scope "${VERCEL_ORG_ID}" --project "${VERCEL_PROJECT_ID}" 2>&1)"
echo "${DEPLOY_OUTPUT}"
echo "✓ Frontend deployed to Vercel."
log "Final production verification"
curl --silent --show-error --fail --max-time 15 "${RENDER_BACKEND_URL%/}/api/v1/health" >/tmp/finora-final-health.txt
cat /tmp/finora-final-health.txt; rm -f /tmp/finora-final-health.txt
echo; echo "============================================================"; echo " Finora Production Deployment Successful"; echo "============================================================"; echo "Release: ${RELEASE_TAG}"; echo "Backend: ${BACKEND_IMAGE}"; echo "Database: Neon PostgreSQL"; echo "Backend platform: Render"; echo "Frontend platform: Vercel"; echo "Frontend project: finora-finance"; echo "✓ Backend deployed"; echo "✓ Backend startup / Neon migration gate passed"; echo "✓ Vercel authentication verified"; echo "✓ Vercel project access verified"; echo "✓ Frontend built"; echo "✓ Frontend deployed"; echo "✓ Final backend health check passed"
