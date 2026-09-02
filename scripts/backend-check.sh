#!/usr/bin/env bash

# ============================================================
# Finora Backend Quality Gate
# ============================================================
#
# Purpose:
#   Validate the Finora backend application code before Git
#   push / CI execution.
#
# Execution model:
#
#   This script MUST run inside the backend Docker container.
#
#   Example:
#
#       docker compose exec backend ./scripts/backend-check.sh
#
#
# Responsibilities:
#
#   ✓ Docker backend environment
#   ✓ Backend project structure
#   ✓ Dependency lock consistency
#   ✓ Ruff linting
#   ✓ Ruff formatting
#   ✓ Black formatting
#   ✓ Backend tests
#
#
# NOT responsible for:
#
#   ✗ Starting Docker
#   ✗ Stopping Docker
#   ✗ Managing containers
#   ✗ PostgreSQL validation
#   ✗ Database connectivity
#   ✗ Database integrity
#   ✗ Alembic validation
#   ✗ Database migrations
#
# Database quality gates are handled by:
#
#       root/scripts/db-check.sh
#
#
# Important:
#
#   This script is READ/VALIDATE ONLY.
#
#   It does NOT automatically modify source files.
#
# ============================================================

set -Eeuo pipefail


# ============================================================
# PATHS
# ============================================================

BACKEND_DIR="/backend"

cd "${BACKEND_DIR}"


# ============================================================
# QUALITY-GATE STATE
# ============================================================

TOTAL_GATES=0
PASSED_GATES=0
FAILED_GATES=0

GATE_RESULTS=()


# ============================================================
# DISPLAY
# ============================================================

if [[ -t 1 ]]; then

    RESET='\033[0m'
    BOLD='\033[1m'
    GREEN='\033[0;32m'
    RED='\033[0;31m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'

else

    RESET=''
    BOLD=''
    GREEN=''
    RED=''
    YELLOW=''
    BLUE=''

fi


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


print_section() {

    echo ""
    echo "------------------------------------------------------------"
    echo " $1"
    echo "------------------------------------------------------------"
    echo ""
}


print_step() {

    echo -e "${BLUE}→${RESET} $1"
}


pass_gate() {

    local name="$1"

    TOTAL_GATES=$((TOTAL_GATES + 1))
    PASSED_GATES=$((PASSED_GATES + 1))

    GATE_RESULTS+=(
        "PASS|${name}"
    )

    echo -e "${GREEN}✓ PASS${RESET} ${name}"
    echo ""

}


fail_gate() {

    local name="$1"

    TOTAL_GATES=$((TOTAL_GATES + 1))
    FAILED_GATES=$((FAILED_GATES + 1))

    GATE_RESULTS+=(
        "FAIL|${name}"
    )

    echo -e "${RED}✗ FAIL${RESET} ${name}"
    echo ""

}


warn() {

    echo -e "${YELLOW}! WARN${RESET} $1"
    echo ""

}


# ============================================================
# ERROR HANDLER
# ============================================================

on_error() {

    local exit_code="$?"

    echo ""
    echo -e "${RED}${BOLD}Backend quality gate aborted.${RESET}"
    echo ""
    echo "Exit code: ${exit_code}"
    echo ""

    exit "${exit_code}"
}


trap on_error ERR


# ============================================================
# HEADER
# ============================================================

print_header "Finora Backend Quality Gate"

echo "Execution environment:"
echo "  • Docker backend container"
echo "  • Working directory: ${BACKEND_DIR}"
echo ""

echo "Database validation:"
echo "  • Handled separately by db-check.sh"
echo "  • No database operations are performed here"
echo ""


# ============================================================
# 0. DOCKER BACKEND ENVIRONMENT
# ============================================================

print_section "1. Backend Container Environment"

print_step "Verifying backend application directory..."


if [[ -d "${BACKEND_DIR}" ]]; then

    pass_gate \
        "Backend application directory exists"

else

    fail_gate \
        "Backend application directory exists"

    exit 1

fi


print_step "Checking pyproject.toml..."


if [[ -f "${BACKEND_DIR}/pyproject.toml" ]]; then

    pass_gate \
        "pyproject.toml exists"

else

    fail_gate \
        "pyproject.toml exists"

    exit 1

fi


# ============================================================
# 1. BACKEND STRUCTURE
# ============================================================

print_section "2. Backend Structure"

required_files=(
    "pyproject.toml"
    "uv.lock"
    "alembic.ini"
)


for file in "${required_files[@]}"; do

    if [[ -f "${file}" ]]; then

        pass_gate \
            "Required file exists: ${file}"

    else

        fail_gate \
            "Required file exists: ${file}"

    fi

done


required_directories=(
    "src"
    "tests"
    "migrations"
)


for directory in "${required_directories[@]}"; do

    if [[ -d "${directory}" ]]; then

        pass_gate \
            "Required directory exists: ${directory}"

    else

        fail_gate \
            "Required directory exists: ${directory}"

    fi

done


if [[ "${FAILED_GATES}" -gt 0 ]]; then

    echo "Backend structure validation failed."

    exit 1

fi


# ============================================================
# 2. DEPENDENCY LOCK
# ============================================================

print_section "3. Dependency Lock"

print_step "Checking uv.lock consistency..."


if uv lock --check; then

    pass_gate \
        "uv.lock is synchronized with project dependencies"

else

    fail_gate \
        "uv.lock is synchronized with project dependencies"

    echo ""
    echo "Fix:"
    echo ""
    echo "    uv lock"
    echo ""

    exit 1

fi


# ============================================================
# 3. RUFF LINT
# ============================================================

print_section "4. Ruff Linting"

print_step "Running Ruff..."


if uv run ruff check src tests; then

    pass_gate \
        "Ruff linting passes"

else

    fail_gate \
        "Ruff linting passes"

    echo ""
    echo "Ruff found issues requiring manual correction."
    echo ""

    exit 1

fi


# ============================================================
# 4. RUFF FORMAT
# ============================================================

print_section "5. Ruff Formatting"

print_step "Checking Ruff formatting..."


if uv run ruff format --check src tests; then

    pass_gate \
        "Ruff formatting is clean"

else

    fail_gate \
        "Ruff formatting is clean"

    echo ""
    echo "Formatting changes are required."
    echo ""
    echo "Run locally:"
    echo ""
    echo "    uv run ruff format src tests"
    echo ""

    exit 1

fi


# ============================================================
# 5. BLACK
# ============================================================

print_section "6. Black Formatting"

print_step "Checking Black formatting..."


if uv run black --check src tests; then

    pass_gate \
        "Black formatting is clean"

else

    fail_gate \
        "Black formatting is clean"

    echo ""
    echo "Black formatting changes are required."
    echo ""
    echo "Run locally:"
    echo ""
    echo "    uv run black src tests"
    echo ""

    exit 1

fi


# ============================================================
# 6. BACKEND TESTS
# ============================================================

print_section "7. Backend Tests"

print_step "Running pytest inside backend container..."


if uv run pytest; then

    pass_gate \
        "Backend test suite passes"

else

    fail_gate \
        "Backend test suite passes"

    echo ""
    echo "Backend tests failed."
    echo ""

    exit 1

fi


# ============================================================
# FINAL REPORT
# ============================================================

print_section "Backend Quality-Gate Report"


echo "Gate results:"
echo ""


for result in "${GATE_RESULTS[@]}"; do

    status="${result%%|*}"
    name="${result#*|}"


    if [[ "${status}" == "PASS" ]]; then

        echo -e "  ${GREEN}[PASS]${RESET} ${name}"

    else

        echo -e "  ${RED}[FAIL]${RESET} ${name}"

    fi

done


echo ""
echo "------------------------------------------------------------"
echo ""

echo "Total gates : ${TOTAL_GATES}"
echo "Passed      : ${PASSED_GATES}"
echo "Failed      : ${FAILED_GATES}"

echo ""


# ============================================================
# FINAL RESULT
# ============================================================

if [[ "${FAILED_GATES}" -eq 0 ]]; then

    echo "============================================================"
    echo -e " ${GREEN}${BOLD}BACKEND QUALITY GATE PASSED${RESET}"
    echo "============================================================"
    echo ""

    echo "Backend is ready for the next quality-gate stage."
    echo ""

    echo "Validated:"
    echo "  ✓ Docker backend environment"
    echo "  ✓ Backend structure"
    echo "  ✓ Dependency lock"
    echo "  ✓ Ruff linting"
    echo "  ✓ Ruff formatting"
    echo "  ✓ Black formatting"
    echo "  ✓ Backend tests"
    echo ""

    echo "Database:"
    echo "  → PostgreSQL validation: db-check.sh"
    echo "  → Database connectivity: db-check.sh"
    echo "  → Alembic validation: db-check.sh"
    echo "  → Database summary: db-check.sh"
    echo ""

    exit 0

fi


echo "============================================================"
echo -e " ${RED}${BOLD}BACKEND QUALITY GATE FAILED${RESET}"
echo "============================================================"
echo ""

exit 1

