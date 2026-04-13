"""
app/models/proof_of_delivery.py
Proof-of-Delivery (PoD) — links an order to its photographic evidence
and digital signature. One PoD per order (unique constraint on order_id).
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Numeric, DateTime, ForeignKey, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class ProofOfDelivery(Base):
    __tablename__ = "proof_of_deliveries"

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
    # One PoD per order — enforced by unique constraint
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    delivered_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Cloudinary secure URL of the delivery photo
    image_url: Mapped[str] = mapped_column(String(1000), nullable=False)

    # Base64-encoded SVG/PNG signature captured on driver's device
    signature_data: Mapped[str | None] = mapped_column(Text, nullable=True)

    # GPS coordinates at time of delivery (flat decimals — PoD forensics)
    latitude: Mapped[float | None] = mapped_column(Numeric(10, 8), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(11, 8), nullable=True)

    delivered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    order = relationship("Order", lazy="select")
    driver = relationship("User", foreign_keys=[delivered_by], lazy="select")

    def __repr__(self) -> str:
        return f"<ProofOfDelivery order={self.order_id} at={self.delivered_at}>"
