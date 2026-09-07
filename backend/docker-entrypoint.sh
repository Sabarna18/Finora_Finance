#!/usr/bin/env bash

# ==========================================================
# Finora - Backend Docker Entrypoint
# Single Neon PostgreSQL database
# ==========================================================

set -Eeuo pipefail


# ==========================================================
# Configuration
# ==========================================================

APP_ENV="${APP_ENV:-development}"


# ==========================================================
# Logging
# ==========================================================

log() {
    echo ""
    echo "=================================================="
    echo " $1"
    echo "=================================================="
}


# ==========================================================
# Validate Application Environment
# ==========================================================

validate_environment() {
    log "Environment Configuration"

    case "${APP_ENV}" in
        development)
            echo "Environment : development"
            ;;

        production)
            echo "Environment : production"
            ;;

        *)
            echo ""
            echo "ERROR: Unsupported APP_ENV: ${APP_ENV}"
            echo ""
            echo "Supported environments:"
            echo "  development"
            echo "  production"
            echo ""
            exit 1
            ;;
    esac
}


# ==========================================================
# Validate Neon Configuration
# ==========================================================

validate_database_configuration() {
    log "Neon Database Configuration"

    required_variables=(
        POSTGRES_USER
        POSTGRES_PASSWORD
        POSTGRES_HOST
        POSTGRES_PORT
        POSTGRES_DB
        POSTGRES_SSLMODE
    )

    for variable in "${required_variables[@]}"; do
        if [[ -z "${!variable:-}" ]]; then
            echo ""
            echo "ERROR: Required database variable is missing:"
            echo "  ${variable}"
            echo ""
            exit 1
        fi
    done

    if [[ "${POSTGRES_SSLMODE}" != "require" ]]; then
        echo ""
        echo "ERROR: Invalid PostgreSQL SSL mode."
        echo "Finora requires Neon SSL/TLS."
        echo ""
        echo "Expected:"
        echo "  POSTGRES_SSLMODE=require"
        echo ""
        echo "Received:"
        echo "  POSTGRES_SSLMODE=${POSTGRES_SSLMODE}"
        echo ""
        exit 1
    fi

    echo "Database    : Neon PostgreSQL"
    echo "Host        : ${POSTGRES_HOST}"
    echo "Port        : ${POSTGRES_PORT}"
    echo "Database    : ${POSTGRES_DB}"
    echo "SSL mode    : ${POSTGRES_SSLMODE}"
}


# ==========================================================
# Check Neon Connectivity
# ==========================================================

check_database_connection() {
    log "Checking Neon PostgreSQL Connection"

    python - <<'PY'
import os
import sys

import psycopg2


try:
    connection = psycopg2.connect(
        host=os.environ["POSTGRES_HOST"],
        port=int(os.environ["POSTGRES_PORT"]),
        database=os.environ["POSTGRES_DB"],
        user=os.environ["POSTGRES_USER"],
        password=os.environ["POSTGRES_PASSWORD"],
        sslmode=os.environ["POSTGRES_SSLMODE"],
        connect_timeout=10,
    )

    connection.close()

except Exception as exc:
    print("")
    print("ERROR: Unable to connect to Neon PostgreSQL.")
    print(f"Reason: {exc}")
    print("")
    sys.exit(1)

print("✓ Neon PostgreSQL connection successful")
PY
}


# ==========================================================
# Database Migrations
# ==========================================================

run_migrations() {
    log "Running Database Migrations"

    uv run alembic upgrade head

    echo ""
    echo "✓ Database migrations completed"
}


# ==========================================================
# Start Development Server
# ==========================================================

start_development() {
    log "Starting Finora API — Development"

    exec uv run uvicorn \
        src.app:app \
        --host 0.0.0.0 \
        --port 8000 \
        --reload
}


# ==========================================================
# Start Production Server
# ==========================================================

start_production() {
    log "Starting Finora API — Production"

    exec uv run uvicorn \
        src.app:app \
        --host 0.0.0.0 \
        --port "${PORT:-8000}"
}


# ==========================================================
# Main
# ==========================================================

main() {
    log "Finora Backend Starting"

    validate_environment

    validate_database_configuration

    check_database_connection

    run_migrations

    case "${APP_ENV}" in
        development)
            start_development
            ;;

        production)
            start_production
            ;;
    esac
}


# ==========================================================
# Execute
# ==========================================================

main "$@"