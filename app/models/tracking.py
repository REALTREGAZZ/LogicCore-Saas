"""
app/models/tracking.py
GPS tracking events ingested from driver mobile apps.
Supports offline cache via synced=False flag — when a driver reconnects
after losing signal, they POST a batch of unsynced events which are then
bulk-inserted with synced=True.
"""
import uuid
from datetime import datetime, timezone

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, DateTime, Numeric, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base


class TrackingEvent(Base):
    __tablename__ = "tracking_events"

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
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    driver_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # PostGIS point for this GPS ping
    location = mapped_column(
        Geometry(geometry_type="POINT", srid=4326), nullable=False
    )
    speed_kmh: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    heading_deg: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)

    # Timestamp when the device recorded this event (may be in the past for offline sync)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    # True = arrived in real-time; False = cached offline, synced on reconnect
    synced: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Full raw JSON payload from the driver app for forensic debugging
    raw_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<TrackingEvent driver={self.driver_id} "
            f"synced={self.synced} at={self.recorded_at}>"
        )
