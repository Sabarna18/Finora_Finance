#!/usr/bin/env bash

# ============================================================
# Finora Frontend Quality Gate
#
# Purpose:
#   Final local verification before Git push.
#
# Responsibilities:
#   1. Validate frontend structure
#   2. Validate npm lockfile
#   3. Install reproducible dependencies
#   4. Apply safe ESLint auto-fixes
#   5. Validate TypeScript
#   6. Validate ESLint
#   7. Validate production build
#
# Automatically handled:
#   - ESLint safe auto-fixes
#   - Formatting
#   - Dependency installation from package-lock.json
#
# Intentionally NOT handled automatically:
#   - npm audit fix
#   - Dependency upgrades
#   - React architectural refactoring
#   - Changes requiring application-level decisions
#
# Security / infrastructure validation belongs in CI/CD.
#
# Usage:
#
#     make check
#
# ============================================================

set -euo pipefail


# ============================================================
# PATHS
# ============================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/frontend"

cd "${FRONTEND_DIR}"


# ============================================================
# HELPERS
# ============================================================

print_header() {
    echo ""
    echo "============================================================"
    echo " $1"
    echo "============================================================"
    echo ""
}

print_step() {
    echo "→ $1"
}

print_success() {
    echo "✓ $1"
    echo ""
}


# ============================================================
# START
# ============================================================

print_header "Finora Frontend Quality Gate"


# ============================================================
# 1. FRONTEND STRUCTURE
# ============================================================

print_step "Checking frontend structure..."

required_files=(
    "package.json"
    "package-lock.json"
    "tsconfig.json"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "${file}" ]]; then
        echo "✗ Missing required file: ${file}"
        exit 1
    fi
done

required_directories=(
    "src"
)

for directory in "${required_directories[@]}"; do
    if [[ ! -d "${directory}" ]]; then
        echo "✗ Missing required directory: ${directory}"
        exit 1
    fi
done

print_success "Frontend structure OK"


# ============================================================
# 2. DEPENDENCY LOCK VALIDATION
# ============================================================
#
# npm ci guarantees that package-lock.json and package.json
# are consistent and installs exactly the locked dependency
# tree.
#
# --ignore-scripts prevents arbitrary lifecycle scripts from
# executing during the local quality gate.
#
# We deliberately do NOT run:
#
#     npm audit fix
#
# because that can modify package-lock.json and upgrade
# dependencies immediately before a Git push.
#
# Dependency security scanning belongs in CI/CD.
#
# ============================================================

print_step "Checking npm dependency lock..."

npm ci --ignore-scripts

print_success "npm dependencies are reproducible"


# ============================================================
# 3. ESLINT SAFE AUTO-FIX
# ============================================================
#
# ESLint is allowed to fix only rules that explicitly support
# safe automatic fixes.
#
# This handles mechanical issues such as:
#
#   - import ordering
#   - unused imports where ESLint supports fixing
#   - semicolon/style issues
#   - spacing
#   - other safe ESLint transformations
#
# It will NOT automatically rewrite React component logic.
#
# ============================================================

print_step "Applying safe ESLint fixes..."

if ! npm run lint -- --fix; then
    echo ""
    echo "✗ ESLint found issues that cannot be automatically fixed."
    echo ""
    echo "Manual correction is required."
    echo ""
    echo "Run:"
    echo ""
    echo "    cd frontend"
    echo "    npm run lint"
    echo ""
    exit 1
fi

print_success "Safe ESLint fixes applied"


# ============================================================
# 4. TYPESCRIPT
# ============================================================

print_step "Running TypeScript compiler..."

npx tsc --noEmit

print_success "TypeScript passed"


# ============================================================
# 5. FINAL ESLINT VALIDATION
# ============================================================

print_step "Running final ESLint validation..."

if ! npm run lint; then
    echo ""
    echo "✗ ESLint validation failed."
    echo ""
    echo "The remaining issues require application-level changes."
    echo ""
    echo "Run:"
    echo ""
    echo "    cd frontend"
    echo "    npm run lint"
    echo ""
    exit 1
fi

print_success "ESLint passed"


# ============================================================
# 6. PRODUCTION BUILD
# ============================================================

print_step "Running production build..."

npm run build

print_success "Production build passed"


# ============================================================
# 7. FINAL STATUS
# ============================================================

print_header "✓ FRONTEND CHECKS PASSED"

echo "Frontend is ready for Git push."
echo ""
echo "  ✓ Structure valid"
echo "  ✓ Dependencies reproducible"
echo "  ✓ Safe ESLint fixes applied"
echo "  ✓ TypeScript clean"
echo "  ✓ ESLint clean"
echo "  ✓ Production build passed"
echo ""
echo "Dependency security auditing and infrastructure"
echo "validation are handled by CI/CD."
echo ""

