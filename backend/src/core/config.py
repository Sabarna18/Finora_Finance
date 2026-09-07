# ==========================================================
# src/core/config.py
# ==========================================================

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


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
    APP_ENV: str = "development"
    DEBUG: bool = False

    # ======================================================
    # Database
    # ======================================================

    # Finora uses PostgreSQL exclusively.
    # The PostgreSQL database is hosted by Neon.

    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str
    POSTGRES_SSLMODE: str = "require"

    # ======================================================
    # Security
    # ======================================================

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ======================================================
    # CORS
    # ======================================================

    BACKEND_CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: [
            "http://localhost",
            "http://localhost:3000",
            "http://localhost:5173",
        ]
    )

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
# SETTINGS
# ==========================================================

@lru_cache
def get_settings() -> Settings:
    """
    Return cached application settings.
    """
    return Settings()


settings = get_settings()