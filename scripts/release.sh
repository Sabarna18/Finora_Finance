#!/usr/bin/env bash

# ============================================================
# Finora — Docker Release
#
# Purpose:
#   Publish the Docker images that have already passed the
#   complete Docker validation workflow.
#
# Release flow:
#
#   git tag v1.0.0
#          ↓
#   Docker Validation
#          ↓
#   Docker images
#          ↓
#   Docker Release
#          ↓
#   GHCR
#          ↓
#   Render pulls backend image
#
# IMPORTANT:
#   - This script does NOT connect to Neon.
#   - This script does NOT run database migrations.
#   - This script does NOT rebuild images.
#   - Neon credentials must NEVER be included in the release
#     workflow or Docker image.
#   - The backend image is runtime-configured by Render using
#     the Neon environment variables.
#
# Usage:
#
#   ./scripts/release.sh v1.0.0
#
# ============================================================

set -Eeuo pipefail

# ============================================================
# CONFIGURATION
# ============================================================

REGISTRY="${REGISTRY:-ghcr.io}"

BACKEND_IMAGE_NAME="${BACKEND_IMAGE_NAME:-finora-backend}"
WEB_IMAGE_NAME="${WEB_IMAGE_NAME:-finora-web}"

VALIDATED_BACKEND_IMAGE="${VALIDATED_BACKEND_IMAGE:-finora-ci-backend}"
VALIDATED_WEB_IMAGE="${VALIDATED_WEB_IMAGE:-finora-ci-web}"

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
    printf '%b\n' "${BLUE}[RELEASE]${NC} $*"
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
# ERROR HANDLER
# ============================================================

on_error() {
    local line="$1"

    error "Release failed at line ${line}."
    printf '\n'
    warning "Release was NOT completed."
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
# ARGUMENT VALIDATION
# ============================================================

if [[ $# -ne 1 ]]; then
    error "Exactly one version tag is required."

    printf '\n'
    printf 'Usage:\n'
    printf '  %s v1.0.0\n' "$0"

    exit 1
fi

VERSION_TAG="$1"

# ============================================================
# VERSION VALIDATION
#
# Expected Git tag:
#
#   v1.0.0
#   v1.2.3
#   v10.20.30
#
# Docker image tags:
#
#   1.0.0
#   latest
#
# ============================================================

if [[ ! "${VERSION_TAG}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    error "Invalid version tag: ${VERSION_TAG}"

    printf '\n'
    printf 'Expected format:\n'
    printf '  vMAJOR.MINOR.PATCH\n'
    printf '\n'
    printf 'Example:\n'
    printf '  v1.0.0\n'

    exit 1
fi

VERSION="${VERSION_TAG#v}"

# ============================================================
# GITHUB ENVIRONMENT VALIDATION
# ============================================================

if [[ -z "${GITHUB_REPOSITORY:-}" ]]; then
    error "GITHUB_REPOSITORY is not set."
    exit 1
fi

if [[ -z "${GITHUB_REPOSITORY_OWNER:-}" ]]; then
    error "GITHUB_REPOSITORY_OWNER is not set."
    exit 1
fi

if [[ -z "${GITHUB_ACTOR:-}" ]]; then
    error "GITHUB_ACTOR is not set."
    exit 1
fi

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
    error "GITHUB_TOKEN is not set."
    exit 1
fi

# ============================================================
# NORMALIZE GHCR OWNER
# ============================================================

OWNER="$(printf '%s' "${GITHUB_REPOSITORY_OWNER}" | tr '[:upper:]' '[:lower:]')"

# ============================================================
# IMAGE REFERENCES
# ============================================================

BACKEND_REPOSITORY="${REGISTRY}/${OWNER}/${BACKEND_IMAGE_NAME}"
WEB_REPOSITORY="${REGISTRY}/${OWNER}/${WEB_IMAGE_NAME}"

BACKEND_VERSION_IMAGE="${BACKEND_REPOSITORY}:${VERSION}"
BACKEND_LATEST_IMAGE="${BACKEND_REPOSITORY}:latest"

WEB_VERSION_IMAGE="${WEB_REPOSITORY}:${VERSION}"
WEB_LATEST_IMAGE="${WEB_REPOSITORY}:latest"

# ============================================================
# RELEASE INFORMATION
# ============================================================

printf '\n'
echo "============================================================"
echo " Finora Docker Release"
echo "============================================================"
printf '\n'

log "Repository       : ${GITHUB_REPOSITORY}"
log "Release tag      : ${VERSION_TAG}"
log "Version          : ${VERSION}"
log "Registry         : ${REGISTRY}"
log "GHCR owner       : ${OWNER}"
log "Backend image    : ${BACKEND_REPOSITORY}"
log "Web image        : ${WEB_REPOSITORY}"

printf '\n'

# ============================================================
# DOCKER REQUIREMENTS
# ============================================================

log "Checking Docker environment..."

require_command docker

if ! docker info >/dev/null 2>&1; then
    error "Docker daemon is not available."
    exit 1
fi

success "Docker environment is available."

# ============================================================
# VALIDATED IMAGE VERIFICATION
#
# The release stage publishes the exact images produced by the
# preceding Docker validation stage.
#
# No rebuild occurs here.
#
# ============================================================

log "Verifying validated backend image..."

if ! docker image inspect "${VALIDATED_BACKEND_IMAGE}" >/dev/null 2>&1; then
    error "Validated backend image not found:"
    error "  ${VALIDATED_BACKEND_IMAGE}"
    error "The Docker validation stage must run before release."
    exit 1
fi

success "Validated backend image found."

log "Verifying validated web image..."

if ! docker image inspect "${VALIDATED_WEB_IMAGE}" >/dev/null 2>&1; then
    error "Validated web image not found:"
    error "  ${VALIDATED_WEB_IMAGE}"
    error "The Docker validation stage must run before release."
    exit 1
fi

success "Validated web image found."

# ============================================================
# DISPLAY SOURCE IMAGE IDS
# ============================================================

printf '\n'

log "Validated image information:"

docker image inspect \
    "${VALIDATED_BACKEND_IMAGE}" \
    --format 'Backend ID: {{.Id}}'

docker image inspect \
    "${VALIDATED_WEB_IMAGE}" \
    --format 'Web ID:     {{.Id}}'

# ============================================================
# GHCR LOGIN
# ============================================================

printf '\n'

log "Authenticating with GitHub Container Registry..."

printf '%s' "${GITHUB_TOKEN}" | \
    docker login \
        "${REGISTRY}" \
        --username "${GITHUB_ACTOR}" \
        --password-stdin

success "GHCR authentication successful."

# ============================================================
# BACKEND TAGGING
# ============================================================

printf '\n'

log "Tagging validated backend image..."

docker tag \
    "${VALIDATED_BACKEND_IMAGE}" \
    "${BACKEND_VERSION_IMAGE}"

docker tag \
    "${VALIDATED_BACKEND_IMAGE}" \
    "${BACKEND_LATEST_IMAGE}"

success "Backend release tags created."

log "Backend version tag:"
log "  ${BACKEND_VERSION_IMAGE}"

log "Backend latest tag:"
log "  ${BACKEND_LATEST_IMAGE}"

# ============================================================
# WEB TAGGING
# ============================================================

printf '\n'

log "Tagging validated web image..."

docker tag \
    "${VALIDATED_WEB_IMAGE}" \
    "${WEB_VERSION_IMAGE}"

docker tag \
    "${VALIDATED_WEB_IMAGE}" \
    "${WEB_LATEST_IMAGE}"

success "Web release tags created."

log "Web version tag:"
log "  ${WEB_VERSION_IMAGE}"

log "Web latest tag:"
log "  ${WEB_LATEST_IMAGE}"

# ============================================================
# BACKEND PUSH
# ============================================================

printf '\n'

log "Publishing backend version image..."

docker push \
    "${BACKEND_VERSION_IMAGE}"

success "Backend ${VERSION} image published."

log "Publishing backend latest image..."

docker push \
    "${BACKEND_LATEST_IMAGE}"

success "Backend latest image published."

# ============================================================
# WEB PUSH
# ============================================================

printf '\n'

log "Publishing web version image..."

docker push \
    "${WEB_VERSION_IMAGE}"

success "Web ${VERSION} image published."

log "Publishing web latest image..."

docker push \
    "${WEB_LATEST_IMAGE}"

success "Web latest image published."

# ============================================================
# RELEASE SUMMARY
# ============================================================

printf '\n'

echo "============================================================"
echo " Docker Release Completed"
echo "============================================================"
printf '\n'

success "Release ${VERSION_TAG} published successfully."

printf '\n'

echo "Published images:"
echo
echo "  ${BACKEND_VERSION_IMAGE}"
echo "  ${BACKEND_LATEST_IMAGE}"
echo
echo "  ${WEB_VERSION_IMAGE}"
echo "  ${WEB_LATEST_IMAGE}"

printf '\n'

echo "Render backend deployment:"
echo
echo "  Use the versioned backend image:"
echo "  ${BACKEND_VERSION_IMAGE}"
echo
echo "  Do NOT use the latest tag for production deployment."
echo
echo "Neon database:"
echo
echo "  Configured at Render runtime through environment variables."
echo "  No Neon credentials are stored in the image."

printf '\n'

success "GHCR publication completed."
