#!/usr/bin/env bash

# ============================================================
# Finora Backend Quality Gate
#
# Purpose:
#   Final local verification before Git push.
#
# Responsibilities:
#   1. Validate backend structure
#   2. Validate uv.lock
#   3. Automatically fix safe Ruff issues
#   4. Format Python code
#   5. Validate Ruff
#   6. Validate Black
#   7. Run backend tests
#
# Intentionally NOT handled here:
#   - Docker
#   - PostgreSQL connectivity
#   - Alembic upgrade/check
#   - Production environment validation
#
# Those checks belong in CI/CD.
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
BACKEND_DIR="${ROOT_DIR}/backend"

cd "${BACKEND_DIR}"


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

print_header "Finora Backend Quality Gate"


# ============================================================
# 1. BACKEND STRUCTURE
# ============================================================

print_step "Checking backend structure..."

required_files=(
    "pyproject.toml"
    "uv.lock"
    "alembic.ini"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "${file}" ]]; then
        echo "✗ Missing required file: ${file}"
        exit 1
    fi
done

required_directories=(
    "src"
    "tests"
    "migrations"
)

for directory in "${required_directories[@]}"; do
    if [[ ! -d "${directory}" ]]; then
        echo "✗ Missing required directory: ${directory}"
        exit 1
    fi
done

print_success "Backend structure OK"


# ============================================================
# 2. LOCK FILE
# ============================================================

print_step "Checking locked dependencies..."

uv lock --check

print_success "uv.lock is up to date"


# ============================================================
# 3. RUFF SAFE AUTO-FIX
# ============================================================

print_step "Applying safe Ruff fixes..."

uv run ruff check src tests --fix

print_success "Safe Ruff fixes applied"


# ============================================================
# 4. RUFF FORMAT
# ============================================================

print_step "Formatting Python with Ruff..."

uv run ruff format src tests

print_success "Ruff formatting complete"


# ============================================================
# 5. BLACK FORMAT
# ============================================================

print_step "Running Black..."

uv run black src tests

print_success "Black formatting complete"


# ============================================================
# 6. FINAL RUFF AUTO-FIX
# ============================================================

print_step "Running final Ruff auto-fix pass..."

uv run ruff check src tests --fix

print_success "Final Ruff auto-fix pass complete"


# ============================================================
# 7. RUFF LINT VALIDATION
# ============================================================

print_step "Running final Ruff lint check..."

if ! uv run ruff check src tests; then
    echo ""
    echo "✗ Ruff found issues that cannot be automatically fixed."
    echo ""
    echo "Manual correction is required."
    echo ""
    echo "Run:"
    echo ""
    echo "    cd backend"
    echo "    uv run ruff check src tests"
    echo ""
    exit 1
fi

print_success "Ruff lint passed"


# ============================================================
# 8. RUFF FORMAT VALIDATION
# ============================================================

print_step "Checking Ruff formatting..."

uv run ruff format --check src tests

print_success "Ruff formatting passed"


# ============================================================
# 9. BLACK VALIDATION
# ============================================================

print_step "Checking Black formatting..."

uv run black --check src tests

print_success "Black formatting passed"


# ============================================================
# 10. PYTEST
# ============================================================

print_step "Running backend tests..."

uv run pytest

print_success "Backend tests passed"


# ============================================================
# FINAL STATUS
# ============================================================

print_header "✓ BACKEND CHECKS PASSED"

echo "Backend is ready for Git push."
echo ""
echo "  ✓ Structure valid"
echo "  ✓ Dependencies locked"
echo "  ✓ Ruff issues fixed"
echo "  ✓ Python formatted"
echo "  ✓ Ruff lint clean"
echo "  ✓ Ruff formatting clean"
echo "  ✓ Black clean"
echo "  ✓ Backend tests passed"
echo ""
echo "Docker, PostgreSQL, and Alembic validation"
echo "are handled by CI/CD."
echo ""

