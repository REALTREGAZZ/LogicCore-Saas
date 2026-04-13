"""
app/models/__init__.py
Import all models so Alembic autogenerate detects them.
"""
from app.models.tenant import Tenant  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.vehicle import Vehicle  # noqa: F401
from app.models.order import Order  # noqa: F401
from app.models.tracking import TrackingEvent  # noqa: F401
from app.models.proof_of_delivery import ProofOfDelivery  # noqa: F401
