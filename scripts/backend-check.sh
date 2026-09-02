#!/usr/bin/env bash

# ============================================================
# Finora Backend Quality Gate
#
# Purpose:
#   Final backend verification before Git push.
#
# IMPORTANT:
#
#   This script is intended to run INSIDE the Finora backend
#   Docker container.
#
#   The Makefile is responsible for entering the container:
#
#       docker compose exec backend ./scripts/backend-check.sh
#
#   This script itself does NOT:
#
#     - Start Docker
#     - Stop Docker
#     - Manage Docker containers
#     - Run Alembic
#     - Modify the database schema
#
#   Database validation is handled separately by:
#
#       scripts/db-check.sh
#
# ============================================================

set -Eeuo pipefail


# ============================================================
# PATHS
# ============================================================

BACKEND_DIR="/backend"

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

print_error() {
    echo ""
    echo "✗ $1"
    echo ""
}


# ============================================================
# DOCKER ENVIRONMENT VALIDATION
#
# This script is expected to execute inside the backend
# container.
#
# /backend is the application working directory defined by
# the Docker image.
# ============================================================

print_header "Finora Backend Quality Gate"


# ============================================================
# 0. VERIFY CONTAINER ENVIRONMENT
# ============================================================

print_step "Verifying Docker backend environment..."

if [[ ! -d "${BACKEND_DIR}" ]]; then
    print_error "Backend application directory not found."

    echo "Expected:"
    echo ""
    echo "    ${BACKEND_DIR}"
    echo ""

    exit 1
fi

if [[ ! -f "${BACKEND_DIR}/pyproject.toml" ]]; then
    print_error "Backend Docker environment is invalid."

    echo "Missing:"
    echo ""
    echo "    ${BACKEND_DIR}/pyproject.toml"
    echo ""

    exit 1
fi

print_success "Docker backend environment OK"


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
        print_error "Missing required file: ${file}"
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
        print_error "Missing required directory: ${directory}"
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
# 3. RUFF SAFE FIXES
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
# 5. BLACK
# ============================================================

print_step "Running Black..."

uv run black src tests

print_success "Black formatting complete"


# ============================================================
# 6. FINAL RUFF FIX
# ============================================================

print_step "Running final Ruff auto-fix..."

uv run ruff check src tests --fix

print_success "Final Ruff auto-fix complete"


# ============================================================
# 7. RUFF VALIDATION
# ============================================================

print_step "Running final Ruff validation..."

if ! uv run ruff check src tests; then
    print_error "Ruff validation failed."

    echo "Manual correction is required."
    echo ""

    exit 1
fi

print_success "Ruff validation passed"


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

print_success "Black validation passed"


# ============================================================
# 10. BACKEND TESTS
#
# Tests run inside the same Docker Python environment as the
# application.
#
# Database/Alembic validation is intentionally NOT performed
# here.
# ============================================================

print_step "Running backend tests..."

uv run pytest

print_success "Backend tests passed"


# ============================================================
# FINAL
# ============================================================

print_header "✓ BACKEND QUALITY GATE PASSED"

echo "Backend is ready for Git push."
echo ""

echo "  ✓ Docker backend environment valid"
echo "  ✓ Structure valid"
echo "  ✓ Dependencies locked"
echo "  ✓ Ruff clean"
echo "  ✓ Ruff formatting clean"
echo "  ✓ Black clean"
echo "  ✓ Backend tests passed"
echo ""

echo "Database:"
echo "  • PostgreSQL validation is handled separately"
echo "  • Alembic was NOT executed"
echo "  • No database changes were made"
echo ""

echo "Execution environment:"
echo "  • Docker backend container"
echo ""

