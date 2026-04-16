"""
app/core/config.py
Typed settings loaded from .env via pydantic-settings.
All secret credentials are read from environment — never hard-coded.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = "" # postgresql+asyncpg://user:pass@host:port/db

    # ── JWT / Auth ────────────────────────────────────────────────────────────
    SECRET_KEY: str = "dev_secret_key_change_me_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── Cloudinary ────────────────────────────────────────────────────────────
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # ── App ───────────────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    DEBUG: bool = True


@lru_cache()
def get_settings() -> Settings:
    """Cached singleton — reads .env once per process life."""
    s = Settings()
    # Forzar sslmode=require para Supabase si no está presente
    if s.DATABASE_URL and "sslmode=" not in s.DATABASE_URL:
        separator = "&" if "?" in s.DATABASE_URL else "?"
        s.DATABASE_URL += f"{separator}sslmode=require"
    return s


settings = get_settings()
