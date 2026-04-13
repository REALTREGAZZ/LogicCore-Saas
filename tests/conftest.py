"""
tests/conftest.py
Sets required environment variables before any app module is imported,
preventing pydantic-settings from failing on missing .env in CI/test environments.
"""
import os

# Stub out required env vars so pydantic Settings can instantiate
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test_db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-not-production")
os.environ.setdefault("CLOUDINARY_CLOUD_NAME", "test")
os.environ.setdefault("CLOUDINARY_API_KEY", "test")
os.environ.setdefault("CLOUDINARY_API_SECRET", "test")
