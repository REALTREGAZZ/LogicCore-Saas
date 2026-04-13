"""
app/models/vehicle.py
Fleet vehicle with volumetric and weight capacity constraints.
Used by the dispatch engine to filter eligible vehicles.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, DateTime, Numeric, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plate: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    model: Mapped[str] = mapped_column(String(100), nullable=True)
    # Maximum payload capacity in kilograms
    max_weight_kg: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    # Maximum cargo volume in cubic metres
    max_volume_m3: Mapped[float] = mapped_column(Numeric(10, 3), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    tenant = relationship("Tenant", lazy="select")

    def __repr__(self) -> str:
        return f"<Vehicle plate={self.plate} active={self.is_active}>"
