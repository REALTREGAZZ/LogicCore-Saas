"""
app/schemas/delivery.py
"""
from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PoDCreate(BaseModel):
    """Data submitted alongside the PoD image upload."""
    signature_data: Optional[str] = None  # base64 encoded SVG/PNG
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)


class PoDResponse(BaseModel):
    id: UUID
    order_id: UUID
    delivered_by: UUID
    image_url: str
    signature_data: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    delivered_at: datetime

    model_config = {"from_attributes": True}
