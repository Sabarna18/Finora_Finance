# ============================================================
# src/app.py
#
# Finora FastAPI application factory and application entrypoint
# ============================================================


from fastapi import (
    Depends,
    FastAPI,
)

from fastapi.middleware.cors import (
    CORSMiddleware,
)

from sqlalchemy import text

from sqlalchemy.orm import Session


from src.db.database import (
    get_db,
)

from src.core.config import (
    settings,
)

from src.core.middleware import (
    LoggingMiddleware,
)

from src.api.router import (
    api_router,
)

# ============================================================
# APPLICATION FACTORY
# ============================================================


def create_app() -> FastAPI:

    app = FastAPI(
        title=settings.APP_NAME,
        debug=settings.DEBUG,
        version="1.0.0",
    )

    # ========================================================
    # CORS
    #
    # Must be added BEFORE custom middleware.
    # ========================================================

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ========================================================
    # LOGGING
    # ========================================================

    app.add_middleware(
        LoggingMiddleware,
    )

    # ========================================================
    # ROUTER
    # ========================================================

    app.include_router(api_router)

    # ========================================================
    # ROOT ENDPOINT
    # ========================================================

    @app.get("/")
    def root():

        return {"message": "Finance Tracker API running 🚀"}

    # ========================================================
    # DATABASE HEALTH CHECK
    # ========================================================

    @app.get("/test-db")
    def test_db(db: Session = Depends(get_db)):

        result = db.execute(text("SELECT 1")).fetchone()

        return {
            "status": "success",
            "db_response": result[0],
        }

    return app


# ============================================================
# APPLICATION INSTANCE
# ============================================================

app = create_app()
