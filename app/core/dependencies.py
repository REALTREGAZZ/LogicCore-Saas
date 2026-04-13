"""
app/core/dependencies.py
Re-exports common FastAPI dependencies for cleaner imports across routers.
"""
from app.core.database import get_db  # noqa: F401
from app.core.security import get_current_user, require_dispatcher  # noqa: F401
