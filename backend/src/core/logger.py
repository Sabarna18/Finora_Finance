# ==================================================
# src/core/logger.py
# Production-grade application logging
# ==================================================

import os
import uuid
import logging

from contextvars import ContextVar
from logging.handlers import (
    RotatingFileHandler,
)

from src.core.config import (
    settings,
)

# ==================================================
# REQUEST CONTEXT
# ==================================================
# Useful for tracing one API request
# across routers/services/DB operations

request_id_context: ContextVar[str] = ContextVar(
    "request_id",
    default="-",
)


def generate_request_id():
    request_id = str(uuid.uuid4())[:8]

    request_id_context.set(request_id)

    return request_id


# ==================================================
# LOG DIRECTORIES
# ==================================================
LOG_DIR = "logs"

os.makedirs(
    LOG_DIR,
    exist_ok=True,
)

APP_LOG = os.path.join(
    LOG_DIR,
    "app.log",
)

ERROR_LOG = os.path.join(
    LOG_DIR,
    "error.log",
)


# ==================================================
# REQUEST ID FILTER
# ==================================================
class RequestIDFilter(logging.Filter):
    def filter(
        self,
        record,
    ):
        record.request_id = request_id_context.get()

        return True


# ==================================================
# NON ERROR FILTER
# ==================================================
class NonErrorFilter(logging.Filter):

    def filter(
        self,
        record,
    ):
        return record.levelno < logging.ERROR


# ==================================================
# LOGGER SETUP
# ==================================================
def setup_logger():

    logger = logging.getLogger("finance_tracker")

    if logger.handlers:
        return logger

    logger.propagate = False

    # ------------------------------
    # Dynamic log level
    # ------------------------------
    logger.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)

    # ------------------------------
    # Formatter
    # ------------------------------
    formatter = logging.Formatter(
        (
            "%(asctime)s | "
            "%(levelname)s | "
            "%(name)s | "
            "req=%(request_id)s | "
            "%(message)s"
        )
    )

    request_filter = RequestIDFilter()

    # ==================================================
    # CONSOLE
    # ==================================================
    console_handler = logging.StreamHandler()

    console_handler.setFormatter(formatter)

    console_handler.addFilter(request_filter)

    # ==================================================
    # APP LOG FILE
    # ==================================================
    app_handler = RotatingFileHandler(
        APP_LOG,
        maxBytes=10 * 1024 * 1024,
        backupCount=10,
        encoding="utf-8",
    )

    app_handler.setFormatter(formatter)

    app_handler.addFilter(request_filter)

    app_handler.addFilter(NonErrorFilter())

    # ==================================================
    # ERROR LOG FILE
    # ==================================================
    error_handler = RotatingFileHandler(
        ERROR_LOG,
        maxBytes=10 * 1024 * 1024,
        backupCount=10,
        encoding="utf-8",
    )

    error_handler.setLevel(logging.ERROR)

    error_handler.setFormatter(formatter)

    error_handler.addFilter(request_filter)

    # ==================================================
    # ATTACH
    # ==================================================
    logger.addHandler(console_handler)

    logger.addHandler(app_handler)

    logger.addHandler(error_handler)

    return logger


# Global app logger
logger = setup_logger()


# ==================================================
# MODULE LOGGER
# ==================================================
def get_logger(
    name: str,
):
    return logger.getChild(name)
