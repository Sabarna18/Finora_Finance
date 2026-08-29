#!/usr/bin/env bash

# ==========================================================
# Finora - Backend Docker Entrypoint
# ==========================================================

set -Eeuo pipefail


# ==========================================================
# Configuration
# ==========================================================

HOST="${POSTGRES_HOST:-postgres}"
PORT="${POSTGRES_PORT:-5432}"

MAX_RETRIES="${DB_MAX_RETRIES:-30}"
RETRY_INTERVAL="${DB_RETRY_INTERVAL:-2}"


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
# Wait for PostgreSQL
# ==========================================================

wait_for_database() {

    log "Waiting for PostgreSQL"

    local attempt=1

    while ! python - <<PY
import socket
import sys

host = "${HOST}"
port = int("${PORT}")

try:
    with socket.create_connection(
        (host, port),
        timeout=2,
    ):
        pass

except OSError:
    sys.exit(1)
PY
    do

        if (( attempt > MAX_RETRIES )); then

            echo ""
            echo "ERROR: PostgreSQL did not become available."
            echo "Host    : ${HOST}"
            echo "Port    : ${PORT}"
            echo "Retries : ${MAX_RETRIES}"

            exit 1

        fi

        echo "PostgreSQL unavailable."
        echo "Retry ${attempt}/${MAX_RETRIES}..."

        sleep "${RETRY_INTERVAL}"

        ((attempt++))

    done

    echo "✓ PostgreSQL is available"
}


# ==========================================================
# Database migrations
# ==========================================================

run_migrations() {

    log "Running database migrations"

    uv run alembic upgrade head

    echo ""
    echo "✓ Database migrations completed"
}


# ==========================================================
# Start application
# ==========================================================

start_application() {

    log "Starting Finora API"

    exec uv run uvicorn \
        src.app:app \
        --host 0.0.0.0 \
        --port 8000

}


# ==========================================================
# Main
# ==========================================================

log "Finora Backend Starting"

wait_for_database

run_migrations

start_application