from functools import lru_cache

from pydantic import Field
from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)


class Settings(BaseSettings):
    """
    Central configuration for Finora.

    Configuration precedence:

    1. Runtime environment variables
    2. .env file
    3. Python defaults
    """

    # ======================================================
    # Application
    # ======================================================

    APP_NAME: str = "Finora"

    DEBUG: bool = False

    # ======================================================
    # Database
    # ======================================================

    DB_TYPE: str = Field(
        default="sqlite",
        description="Database type: sqlite or postgresql",
    )

    # ------------------------------------------------------
    # SQLite
    # ------------------------------------------------------

    SQLITE_DB_PATH: str = "./finance.db"

    # ------------------------------------------------------
    # PostgreSQL
    # ------------------------------------------------------

    POSTGRES_USER: str = "postgres"

    POSTGRES_PASSWORD: str = "password"

    POSTGRES_HOST: str = "localhost"

    POSTGRES_PORT: int = 5432

    POSTGRES_DB: str = "finance_db"

    # ======================================================
    # Security
    # ======================================================

    SECRET_KEY: str = "supersecretkey"

    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ======================================================
    # CORS
    # ======================================================

    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost",
    ]

    # ======================================================
    # Pydantic Settings
    # ======================================================

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


# ==========================================================
# Cached Settings
# ==========================================================


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
