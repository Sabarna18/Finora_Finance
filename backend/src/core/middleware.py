# ==================================================
# src/core/middleware.py
# ==================================================

import time

from starlette.middleware.base import BaseHTTPMiddleware

from src.core.logger import (
    get_logger,
)

logger = get_logger("middleware")


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request,
        call_next,
    ):

        # --------------------------
        # Request ID
        # --------------------------

        start_time = time.perf_counter()

        try:
            response = await call_next(request)

            duration = (time.perf_counter() - start_time) * 1000

            logger.info(
                f"{request.method} "
                f"{request.url.path} | "
                f"{response.status_code} | "
                f"{duration:.2f}ms"
            )

            return response

        except Exception:
            duration = (time.perf_counter() - start_time) * 1000

            logger.exception(
                f"{request.method} "
                f"{request.url.path} | "
                f"500 | "
                f"{duration:.2f}ms | "
                f"Unhandled exception"
            )

            raise
