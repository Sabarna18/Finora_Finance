#!/usr/bin/env bash

# ============================================================
# Finora — Production Deployment Script
# ============================================================
#
# Current responsibility:
#   Deploy the frontend to Vercel.
#
# Trigger:
#   Called by deploy.yml after a successful versioned release.
#
# Required environment variables:
#   VERCEL_TOKEN
#   VERCEL_ORG_ID
#   VERCEL_PROJECT_ID
#   VITE_API_URL
#
# Optional:
#   VITE_APP_VERSION
#
# Usage:
#   ./scripts/deploy.sh
#
# ============================================================

set -Eeuo pipefail


# ============================================================
# Configuration
# ============================================================

FRONTEND_DIR="${FRONTEND_DIR:-frontend}"

VERCEL_TOKEN="${VERCEL_TOKEN:-}"
VERCEL_ORG_ID="${VERCEL_ORG_ID:-}"
VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID:-}"

VITE_API_URL="${VITE_API_URL:-}"
VITE_APP_VERSION="${VITE_APP_VERSION:-}"


# ============================================================
# Colors
# ============================================================

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


# ============================================================
# Logging
# ============================================================

log() {
    printf '%b\n' "${BLUE}[DEPLOY]${NC} $*"
}

success() {
    printf '%b\n' "${GREEN}✓${NC} $*"
}

error() {
    printf '%b\n' "${RED}✗${NC} $*" >&2
}

warning() {
    printf '%b\n' "${YELLOW}!${NC} $*"
}


# ============================================================
# Validation
# ============================================================

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


# ============================================================
# Start
# ============================================================

printf '\n'
printf '%s\n' '============================================================'
printf '%s\n' ' Finora Production Deployment'
printf '%s\n' '============================================================'
printf '\n'

log "Deployment target: Vercel"
log "Frontend directory: ${FRONTEND_DIR}"

printf '\n'


# ============================================================
# Prerequisites
# ============================================================

require_command node
require_command npm
require_command npx

require_variable VERCEL_TOKEN
require_variable VERCEL_ORG_ID
require_variable VERCEL_PROJECT_ID
require_variable VITE_API_URL


# ============================================================
# Validate frontend
# ============================================================

if [[ ! -d "${FRONTEND_DIR}" ]]; then
    error "Frontend directory not found: ${FRONTEND_DIR}"
    exit 1
fi

if [[ ! -f "${FRONTEND_DIR}/package.json" ]]; then
    error "Frontend package.json not found."
    exit 1
fi


# ============================================================
# Display deployment metadata
# ============================================================

printf '%s\n' '------------------------------------------------------------'
printf '%s\n' ' Deployment Configuration'
printf '%s\n' '------------------------------------------------------------'

printf 'Vercel Organization : %s\n' "${VERCEL_ORG_ID}"
printf 'Vercel Project      : %s\n' "${VERCEL_PROJECT_ID}"
printf 'API URL             : %s\n' "${VITE_API_URL}"

if [[ -n "${VITE_APP_VERSION}" ]]; then
    printf 'App Version         : %s\n' "${VITE_APP_VERSION}"
else
    warning "VITE_APP_VERSION is not set."
fi

printf '\n'


# ============================================================
# Install dependencies
# ============================================================

log "Installing frontend dependencies..."

cd "${FRONTEND_DIR}"

npm ci

success "Frontend dependencies installed."


# ============================================================
# Production build
# ============================================================

log "Building frontend for production..."

export VITE_API_URL

if [[ -n "${VITE_APP_VERSION}" ]]; then
    export VITE_APP_VERSION
fi

npm run build

success "Frontend production build completed."


# ============================================================
# Link local project to Vercel project
# ============================================================

log "Linking frontend to Vercel project..."

npx vercel link \
    --yes \
    --token "${VERCEL_TOKEN}" \
    --scope "${VERCEL_ORG_ID}" \
    --project "${VERCEL_PROJECT_ID}"

success "Vercel project linked."


# ============================================================
# Deploy
# ============================================================
#
# The build has already been produced locally/CI.
# Vercel receives the exact build generated above.
#
# ============================================================

log "Deploying frontend to Vercel production..."

DEPLOY_OUTPUT="$(
    npx vercel deploy \
        --prod \
        --yes \
        --token "${VERCEL_TOKEN}" \
        --scope "${VERCEL_ORG_ID}" \
        2>&1
)"

printf '%s\n' "${DEPLOY_OUTPUT}"

DEPLOYMENT_URL="$(
    printf '%s\n' "${DEPLOY_OUTPUT}" |
        grep -Eo 'https://[^[:space:]]+' |
        tail -n 1 ||
        true
)"

printf '\n'

if [[ -n "${DEPLOYMENT_URL}" ]]; then
    success "Frontend deployment completed."
    printf 'Deployment URL : %s\n' "${DEPLOYMENT_URL}"
else
    success "Frontend deployment completed."
fi


# ============================================================
# Complete
# ============================================================

printf '\n'
printf '%s\n' '============================================================'
printf '%s\n' ' Finora Frontend Deployment Complete'
printf '%s\n' '============================================================'
printf '\n'
