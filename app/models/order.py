"""
app/models/order.py
Delivery order — core entity of the logistics platform.
Uses PostGIS GEOMETRY(Point, 4326) for pickup and delivery locations.
"""
import uuid
from datetime import datetime, timezone

from geoalchemy2 import Geometry
from sqlalchemy import (
    String, Numeric, DateTime, Integer, Enum as SAEnum,
    ForeignKey, text
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

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
    # Assigned driver (nullable until dispatched)
    driver_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    # Assigned vehicle (nullable until dispatched)
    vehicle_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vehicles.id", ondelete="SET NULL"),
        nullable=True,
    )

    # ── Geospatial columns (PostGIS) ──────────────────────────────────────
    pickup_location = mapped_column(
        Geometry(geometry_type="POINT", srid=4326), nullable=False
    )
    delivery_location = mapped_column(
        Geometry(geometry_type="POINT", srid=4326), nullable=False
    )
    pickup_address: Mapped[str] = mapped_column(String(500), nullable=False)
    delivery_address: Mapped[str] = mapped_column(String(500), nullable=False)

    # ── Cargo specs ────────────────────────────────────────────────────────
    weight_kg: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    volume_m3: Mapped[float] = mapped_column(Numeric(10, 3), nullable=False)

    # ── Status / Priority ──────────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        SAEnum(
            "pending", "assigned", "in_transit", "delivered", "incident",
            name="order_status"
        ),
        default="pending",
        nullable=False,
        index=True,
    )
    # 1 = most urgent, 10 = low priority
    priority: Mapped[int] = mapped_column(Integer, default=5, nullable=False)

    # ── Delivery time window ───────────────────────────────────────────────
    delivery_window_start: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    delivery_window_end: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    driver = relationship("User", foreign_keys=[driver_id], lazy="select")
    vehicle = relationship("Vehicle", lazy="select")

    def __repr__(self) -> str:
        return f"<Order id={self.id} status={self.status} priority={self.priority}>"
