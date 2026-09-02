#!/usr/bin/env bash

# ============================================================
# Finora - Continuous Integration Quality Gate
# ============================================================
#
# Purpose:
#   Complete CI validation for the Finora application.
#
# Responsibilities:
#
#   BACKEND
#     1. Validate backend structure
#     2. Validate uv.lock
#     3. Validate dependency installation
#     4. Validate backend imports
#     5. Ruff lint
#     6. Ruff formatting
#     7. Black formatting
#     8. Backend tests
#
#   DATABASE
#     9. Validate PostgreSQL connectivity
#    10. Run Alembic migrations against fresh CI database
#    11. Validate Alembic current revision
#    12. Validate Alembic consistency
#    13. Validate PostgreSQL schema
#    14. Validate critical columns
#
#   FRONTEND
#    15. Validate package files
#    16. Install dependencies with npm ci
#    17. Validate dependency tree
#    18. ESLint
#    19. Production build
#
# IMPORTANT:
#
#   This script DOES NOT modify production databases.
#
#   In CI:
#
#       PostgreSQL → fresh GitHub Actions service
#
#   Local:
#
#       PostgreSQL → localhost:5432
#
#   Docker application:
#
#       PostgreSQL → postgres:5432
#
# ============================================================

set -Eeuo pipefail


# ============================================================
# PATHS
# ============================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"


# ============================================================
# CONFIGURATION
# ============================================================

PYTHON_VERSION_EXPECTED="${PYTHON_VERSION:-3.13}"
NODE_VERSION_EXPECTED="${NODE_VERSION:-22}"

CI_DB_HOST="${POSTGRES_HOST:-localhost}"
CI_DB_PORT="${POSTGRES_PORT:-5432}"
CI_DB_USER="${POSTGRES_USER:-finora}"
CI_DB_PASSWORD="${POSTGRES_PASSWORD:-password}"
CI_DB_NAME="${POSTGRES_DB:-finance_db}"


# ============================================================
# LOGGING
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
# COMMAND CHECK
# ============================================================

require_command() {

    local command_name="$1"

    if ! command -v "${command_name}" >/dev/null 2>&1; then
        print_error "Required command not found: ${command_name}"
        exit 1
    fi
}


# ============================================================
# START
# ============================================================

print_header "Finora Continuous Integration"

echo "Root directory     : ${ROOT_DIR}"
echo "Backend directory  : ${BACKEND_DIR}"
echo "Frontend directory : ${FRONTEND_DIR}"
echo ""

echo "CI PostgreSQL:"
echo "  Host     : ${CI_DB_HOST}"
echo "  Port     : ${CI_DB_PORT}"
echo "  User     : ${CI_DB_USER}"
echo "  Database : ${CI_DB_NAME}"
echo ""


# ============================================================
# 1. TOOLCHAIN VALIDATION
# ============================================================

print_step "Validating CI toolchain..."

require_command python
require_command uv
require_command node
require_command npm

python --version
uv --version
node --version
npm --version

print_success "CI toolchain available"


# ============================================================
# 2. PROJECT STRUCTURE
# ============================================================

print_step "Validating project structure..."

required_root_files=(
    "Makefile"
)

for file in "${required_root_files[@]}"; do

    if [[ ! -f "${ROOT_DIR}/${file}" ]]; then
        print_error "Missing root file: ${file}"
        exit 1
    fi

done


required_backend_files=(
    "pyproject.toml"
    "uv.lock"
    "alembic.ini"
)

for file in "${required_backend_files[@]}"; do

    if [[ ! -f "${BACKEND_DIR}/${file}" ]]; then
        print_error "Missing backend file: ${file}"
        exit 1
    fi

done


required_backend_directories=(
    "src"
    "tests"
    "migrations"
)

for directory in "${required_backend_directories[@]}"; do

    if [[ ! -d "${BACKEND_DIR}/${directory}" ]]; then
        print_error "Missing backend directory: ${directory}"
        exit 1
    fi

done


required_frontend_files=(
    "package.json"
    "package-lock.json"
)

for file in "${required_frontend_files[@]}"; do

    if [[ ! -f "${FRONTEND_DIR}/${file}" ]]; then
        print_error "Missing frontend file: ${file}"
        exit 1
    fi

done


required_frontend_directories=(
    "src"
)

for directory in "${required_frontend_directories[@]}"; do

    if [[ ! -d "${FRONTEND_DIR}/${directory}" ]]; then
        print_error "Missing frontend directory: ${directory}"
        exit 1
    fi

done


print_success "Project structure valid"


# ============================================================
# 3. BACKEND DEPENDENCY LOCK
# ============================================================

print_header "Backend Validation"


print_step "Checking uv.lock..."

cd "${BACKEND_DIR}"

uv lock --check

print_success "uv.lock is synchronized"


# ============================================================
# 4. BACKEND DEPENDENCY INSTALLATION
# ============================================================

print_step "Installing backend dependencies..."

uv sync --frozen

print_success "Backend dependencies installed"


# ============================================================
# 5. BACKEND DEPENDENCY VALIDATION
# ============================================================

print_step "Validating backend dependency environment..."

uv run python -c "
import sys
import sqlalchemy
import fastapi
import pydantic
import alembic
import psycopg2

print('Python:', sys.version)
print('FastAPI:', fastapi.__version__)
print('SQLAlchemy:', sqlalchemy.__version__)
print('Pydantic:', pydantic.__version__)
print('Alembic:', alembic.__version__)
print('psycopg2: OK')
"

print_success "Backend dependencies validated"


# ============================================================
# 6. BACKEND IMPORT VALIDATION
# ============================================================

print_step "Validating backend imports..."

uv run python -c "
from src.app import app
from src.core.config import settings
from src.db.database import Base, DATABASE_URL

print('FastAPI application: OK')
print('Configuration: OK')
print('Database metadata: OK')
print('DATABASE_URL configuration: OK')
print(f'Application: {settings.APP_NAME}')
"

print_success "Backend imports validated"


# ============================================================
# 7. RUFF LINT
# ============================================================

print_step "Running Ruff lint..."

uv run ruff check src tests

print_success "Ruff lint passed"


# ============================================================
# 8. RUFF FORMAT
# ============================================================

print_step "Checking Ruff formatting..."

uv run ruff format --check src tests

print_success "Ruff formatting passed"


# ============================================================
# 9. BLACK
# ============================================================

print_step "Checking Black formatting..."

uv run black --check src tests

print_success "Black formatting passed"


# ============================================================
# 10. BACKEND TESTS
# ============================================================

print_step "Running backend tests..."

uv run pytest -v

print_success "Backend tests passed"


# ============================================================
# 11. POSTGRESQL CONNECTIVITY
# ============================================================

print_header "PostgreSQL Integration Validation"


print_step "Waiting for PostgreSQL..."

MAX_DB_RETRIES=30
DB_RETRY_INTERVAL=2

for ((attempt=1; attempt<=MAX_DB_RETRIES; attempt++)); do

    if uv run python - <<PY
import psycopg2
import sys

try:
    conn = psycopg2.connect(
        host="${CI_DB_HOST}",
        port=${CI_DB_PORT},
        user="${CI_DB_USER}",
        password="${CI_DB_PASSWORD}",
        dbname="${CI_DB_NAME}",
        connect_timeout=3,
    )
    conn.close()
except Exception as exc:
    print(exc)
    sys.exit(1)
PY
    then
        break
    fi

    if (( attempt == MAX_DB_RETRIES )); then
        print_error "PostgreSQL did not become available"
        exit 1
    fi

    echo "PostgreSQL unavailable."
    echo "Retry ${attempt}/${MAX_DB_RETRIES}..."
    sleep "${DB_RETRY_INTERVAL}"

done


print_success "PostgreSQL connection successful"


# ============================================================
# 12. ALEMBIC DATABASE CONFIGURATION
# ============================================================

print_step "Validating Alembic database configuration..."

echo ""
echo "Alembic database:"
echo "  Host     : ${CI_DB_HOST}"
echo "  Port     : ${CI_DB_PORT}"
echo "  User     : ${CI_DB_USER}"
echo "  Database : ${CI_DB_NAME}"
echo ""


# ============================================================
# 13. ALEMBIC CURRENT BEFORE MIGRATION
# ============================================================

print_step "Checking initial Alembic state..."

POSTGRES_HOST="${CI_DB_HOST}" \
POSTGRES_PORT="${CI_DB_PORT}" \
POSTGRES_USER="${CI_DB_USER}" \
POSTGRES_PASSWORD="${CI_DB_PASSWORD}" \
POSTGRES_DB="${CI_DB_NAME}" \
uv run alembic current || true

echo ""

print_success "Initial Alembic state inspected"


# ============================================================
# 14. APPLY MIGRATIONS TO FRESH CI DATABASE
# ============================================================

#
# THIS IS THE IMPORTANT DIFFERENCE FROM THE OLD CI.
#
# We do NOT run:
#
#     alembic check
#
# against an empty database.
#
# An empty database is obviously not at the migration head.
#
# Instead:
#
#     fresh database
#           ↓
#     alembic upgrade head
#           ↓
#     database at migration head
#           ↓
#     alembic current
#           ↓
#     alembic check
#
# This validates the complete migration chain.
#

print_step "Applying Alembic migrations to CI PostgreSQL..."

POSTGRES_HOST="${CI_DB_HOST}" \
POSTGRES_PORT="${CI_DB_PORT}" \
POSTGRES_USER="${CI_DB_USER}" \
POSTGRES_PASSWORD="${CI_DB_PASSWORD}" \
POSTGRES_DB="${CI_DB_NAME}" \
uv run alembic upgrade head

print_success "Alembic migrations applied successfully"


# ============================================================
# 15. VERIFY ALEMBIC CURRENT
# ============================================================

print_step "Verifying Alembic current revision..."

POSTGRES_HOST="${CI_DB_HOST}" \
POSTGRES_PORT="${CI_DB_PORT}" \
POSTGRES_USER="${CI_DB_USER}" \
POSTGRES_PASSWORD="${CI_DB_PASSWORD}" \
POSTGRES_DB="${CI_DB_NAME}" \
uv run alembic current

print_success "Alembic current revision verified"


# ============================================================
# 16. ALEMBIC CONSISTENCY CHECK
# ============================================================

print_step "Running Alembic consistency check..."

POSTGRES_HOST="${CI_DB_HOST}" \
POSTGRES_PORT="${CI_DB_PORT}" \
POSTGRES_USER="${CI_DB_USER}" \
POSTGRES_PASSWORD="${CI_DB_PASSWORD}" \
POSTGRES_DB="${CI_DB_NAME}" \
uv run alembic check

print_success "Alembic consistency check passed"


# ============================================================
# 17. ALEMBIC HEAD VALIDATION
# ============================================================

print_step "Validating Alembic heads..."

HEAD_OUTPUT="$(
    uv run alembic heads
)"

echo "${HEAD_OUTPUT}"

if [[ -z "${HEAD_OUTPUT}" ]]; then
    print_error "No Alembic migration head found."
    exit 1
fi

print_success "Alembic head exists"


# ============================================================
# 18. POSTGRESQL SCHEMA VALIDATION
# ============================================================

print_step "Validating PostgreSQL schema..."

POSTGRES_HOST="${CI_DB_HOST}" \
POSTGRES_PORT="${CI_DB_PORT}" \
POSTGRES_USER="${CI_DB_USER}" \
POSTGRES_PASSWORD="${CI_DB_PASSWORD}" \
POSTGRES_DB="${CI_DB_NAME}" \
uv run python - <<'PY'
from sqlalchemy import create_engine, inspect
from src.db.database import DATABASE_URL

engine = create_engine(DATABASE_URL)

inspector = inspect(engine)

tables = set(inspector.get_table_names())

print("PostgreSQL tables:")
for table in sorted(tables):
    print(f"  - {table}")

required_tables = {
    "users",
    "categories",
    "transactions",
    "budgets",
}

missing = required_tables - tables

if missing:
    raise RuntimeError(
        f"Missing required PostgreSQL tables: {sorted(missing)}"
    )

print()
print("Required PostgreSQL tables: OK")
PY

print_success "PostgreSQL schema validated"


# ============================================================
# 19. CRITICAL COLUMN VALIDATION
# ============================================================

print_step "Validating PostgreSQL columns..."

POSTGRES_HOST="${CI_DB_HOST}" \
POSTGRES_PORT="${CI_DB_PORT}" \
POSTGRES_USER="${CI_DB_USER}" \
POSTGRES_PASSWORD="${CI_DB_PASSWORD}" \
POSTGRES_DB="${CI_DB_NAME}" \
uv run python - <<'PY'
from sqlalchemy import create_engine, inspect
from src.db.database import DATABASE_URL

engine = create_engine(DATABASE_URL)

inspector = inspect(engine)

expected_columns = {
    "users": {
        "id",
        "name",
        "email",
        "password_hash",
        "is_active",
        "created_at",
    },
    "categories": {
        "id",
        "name",
        "type",
        "user_id",
        "created_at",
    },
    "transactions": {
        "id",
        "amount",
        "type",
        "description",
        "date",
        "user_id",
        "category_id",
        "created_at",
    },
    "budgets": {
        "id",
        "amount",
        "month",
        "year",
        "user_id",
        "category_id",
        "created_at",
    },
}

for table, expected in expected_columns.items():

    actual = {
        column["name"]
        for column in inspector.get_columns(table)
    }

    missing = expected - actual

    if missing:
        raise RuntimeError(
            f"{table} is missing columns: {sorted(missing)}"
        )

    print(f"{table}: column validation OK")

print()
print("PostgreSQL column validation: OK")
PY

print_success "PostgreSQL columns validated"


# ============================================================
# 20. FRONTEND VALIDATION
# ============================================================

print_header "Frontend Validation"


cd "${FRONTEND_DIR}"


# ============================================================
# 21. FRONTEND PACKAGE VALIDATION
# ============================================================

print_step "Validating frontend package metadata..."

node -e "
const pkg = require('./package.json');

if (!pkg.name) {
    throw new Error('package.json is missing package name');
}

if (!pkg.scripts) {
    throw new Error('package.json has no scripts section');
}

for (const script of ['lint', 'build']) {
    if (!pkg.scripts[script]) {
        throw new Error(\`Missing npm script: \${script}\`);
    }
}

console.log('Package:', pkg.name);
console.log('Required npm scripts: OK');
"

print_success "Frontend package metadata valid"


# ============================================================
# 22. FRONTEND DEPENDENCY INSTALLATION
# ============================================================

print_step "Installing frontend dependencies..."

npm ci

print_success "Frontend dependencies installed"


# ============================================================
# 23. FRONTEND DEPENDENCY VALIDATION
# ============================================================

print_step "Validating frontend dependency tree..."

npm ls --depth=0

print_success "Frontend dependency tree valid"


# ============================================================
# 24. ESLINT
# ============================================================

print_step "Running ESLint..."

npm run lint

print_success "ESLint passed"


# ============================================================
# 25. FRONTEND BUILD
# ============================================================

print_step "Building production frontend..."

VITE_API_URL="${VITE_API_URL:-/api/v1}" \
npm run build

print_success "Frontend production build passed"


# ============================================================
# 26. FINAL STATUS
# ============================================================

print_header "✓ FINORA CI PASSED"

echo "Backend:"
echo "  ✓ Structure"
echo "  ✓ uv.lock"
echo "  ✓ Dependencies"
echo "  ✓ Imports"
echo "  ✓ Ruff"
echo "  ✓ Ruff format"
echo "  ✓ Black"
echo "  ✓ Pytest"
echo ""

echo "PostgreSQL:"
echo "  ✓ Connection"
echo "  ✓ Alembic migrations"
echo "  ✓ Alembic current"
echo "  ✓ Alembic heads"
echo "  ✓ Alembic consistency"
echo "  ✓ Required tables"
echo "  ✓ Required columns"
echo ""

echo "Frontend:"
echo "  ✓ package.json"
echo "  ✓ package-lock.json"
echo "  ✓ npm ci"
echo "  ✓ dependency tree"
echo "  ✓ ESLint"
echo "  ✓ production build"
echo ""

echo "Finora is CI-ready."
echo ""

