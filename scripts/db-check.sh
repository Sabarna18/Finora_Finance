#!/usr/bin/env bash

# ============================================================
# Finora Database Quality Gate
#
# Purpose:
#   Validate the PostgreSQL database and Alembic migration state
#   from inside the Finora Docker environment.
#
# IMPORTANT:
#
#   This script is Docker-aware by design.
#
#   It expects:
#
#       POSTGRES_HOST=postgres
#       POSTGRES_PORT=5432
#
#   because PostgreSQL is accessed through the Docker Compose
#   internal network.
#
#   This script:
#
#     - Does NOT start Docker
#     - Does NOT stop Docker
#     - Does NOT modify the database schema
#     - Does NOT run "alembic upgrade head"
#
#   It only validates the current database and migration state.
#
# ============================================================

set -Eeuo pipefail


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

print_error() {
    echo ""
    echo "✗ $1"
    echo ""
}


# ============================================================
# DATABASE CONFIGURATION
#
# These values come from the container environment.
#
# Expected Docker configuration:
#
#     POSTGRES_HOST=postgres
#     POSTGRES_PORT=5432
# ============================================================

DB_TYPE="${DB_TYPE:-postgresql}"

DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-finora}"
DB_PASSWORD="${POSTGRES_PASSWORD:-password}"
DB_NAME="${POSTGRES_DB:-finance_db}"


# ============================================================
# DATABASE TYPE VALIDATION
# ============================================================

print_header "Finora Database Quality Gate"

if [[ "${DB_TYPE}" != "postgresql" ]]; then
    print_error "Database quality gate requires PostgreSQL."

    echo "Current DB_TYPE:"
    echo ""
    echo "    ${DB_TYPE}"
    echo ""

    echo "Expected:"
    echo ""
    echo "    DB_TYPE=postgresql"
    echo ""

    exit 1
fi


# ============================================================
# DISPLAY CONFIGURATION
# ============================================================

echo "Database configuration:"
echo ""
echo "    Host     : ${DB_HOST}"
echo "    Port     : ${DB_PORT}"
echo "    Database : ${DB_NAME}"
echo "    User     : ${DB_USER}"
echo ""


# ============================================================
# 1. CHECK POSTGRESQL CLIENT
# ============================================================

print_step "Checking PostgreSQL client tools..."

if ! command -v pg_isready >/dev/null 2>&1; then
    print_error "pg_isready is not installed."

    echo "The backend container must contain the PostgreSQL"
    echo "client utilities."
    echo ""

    exit 1
fi

print_success "PostgreSQL client tools available"


# ============================================================
# 2. CHECK POSTGRESQL AVAILABILITY
#
# IMPORTANT:
#
# The check happens from inside the Docker network.
#
# Therefore:
#
#     postgres:5432
#
# is correct.
# ============================================================

print_step "Checking PostgreSQL availability..."

if ! pg_isready \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" >/dev/null 2>&1; then

    print_error "PostgreSQL is not available."

    echo "Expected:"
    echo ""
    echo "    Host     : ${DB_HOST}"
    echo "    Port     : ${DB_PORT}"
    echo "    Database : ${DB_NAME}"
    echo "    User     : ${DB_USER}"
    echo ""

    echo "Make sure the PostgreSQL container is running:"
    echo ""
    echo "    docker compose up -d postgres"
    echo ""

    exit 1
fi

print_success "PostgreSQL server is available"


# ============================================================
# 3. VERIFY DATABASE AUTHENTICATION
#
# pg_isready checks server readiness, but we also perform a
# real authenticated connection.
# ============================================================

print_step "Verifying PostgreSQL authentication..."

if ! POSTGRES_PASSWORD="${DB_PASSWORD}" \
    POSTGRES_HOST="${DB_HOST}" \
    POSTGRES_PORT="${DB_PORT}" \
    POSTGRES_USER="${DB_USER}" \
    POSTGRES_DB="${DB_NAME}" \
    uv run python - <<'PY'
import os

import psycopg2


connection = psycopg2.connect(
    host=os.environ["POSTGRES_HOST"],
    port=int(os.environ["POSTGRES_PORT"]),
    user=os.environ["POSTGRES_USER"],
    password=os.environ["POSTGRES_PASSWORD"],
    dbname=os.environ["POSTGRES_DB"],
)

try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        cursor.fetchone()
finally:
    connection.close()
PY
then
    print_error "PostgreSQL authentication failed."

    echo "The PostgreSQL server is reachable, but the configured"
    echo "credentials could not authenticate successfully."
    echo ""

    exit 1
fi

print_success "PostgreSQL authentication successful"


# ============================================================
# 4. ALEMBIC CURRENT
# ============================================================

print_step "Checking current Alembic revision..."

if ! uv run alembic current; then
    print_error "Alembic current check failed."
    exit 1
fi

print_success "Alembic current revision retrieved"


# ============================================================
# 5. ALEMBIC HEADS
# ============================================================

print_step "Checking Alembic heads..."

if ! uv run alembic heads; then
    print_error "Alembic heads check failed."
    exit 1
fi

print_success "Alembic heads retrieved"


# ============================================================
# 6. ALEMBIC CONSISTENCY
#
# alembic check validates whether the SQLAlchemy metadata has
# changes that are not represented by migration scripts.
#
# IMPORTANT:
#
# This command does NOT apply migrations.
# ============================================================

print_step "Checking Alembic migration consistency..."

if ! uv run alembic check; then
    print_error "Alembic migration consistency check failed."

    echo "The SQLAlchemy models and Alembic migration state"
    echo "may not be synchronized."
    echo ""

    echo "Inspect the current revision:"
    echo ""
    echo "    uv run alembic current"
    echo ""

    echo "Inspect migration heads:"
    echo ""
    echo "    uv run alembic heads"
    echo ""

    echo "To explicitly apply pending migrations:"
    echo ""
    echo "    uv run alembic upgrade head"
    echo ""

    exit 1
fi

print_success "Alembic migration consistency passed"


# ============================================================
# FINAL RESULT
# ============================================================

print_header "✓ DATABASE QUALITY GATE PASSED"

echo "Database configuration:"
echo ""
echo "    Host     : ${DB_HOST}"
echo "    Port     : ${DB_PORT}"
echo "    Database : ${DB_NAME}"
echo "    User     : ${DB_USER}"
echo ""

echo "Validation:"
echo ""
echo "    ✓ PostgreSQL client available"
echo "    ✓ PostgreSQL server available"
echo "    ✓ PostgreSQL authentication successful"
echo "    ✓ Alembic current checked"
echo "    ✓ Alembic heads checked"
echo "    ✓ Alembic consistency validated"
echo ""

echo "No migrations were applied."
echo ""

