"""
app/schemas/tracking.py
"""
from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class GPSUpdate(BaseModel):
    """Single GPS ping from a driver's mobile app."""
    driver_id: UUID
    order_id: Optional[UUID] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    speed_kmh: Optional[float] = Field(default=None, ge=0)
    heading_deg: Optional[float] = Field(default=None, ge=0, le=360)
    recorded_at: datetime  # Device timestamp


class GPSBatchUpdate(BaseModel):
    """Bulk sync of offline-cached GPS events after reconnect."""
    events: list[GPSUpdate] = Field(..., min_length=1)


class DriverLivePosition(BaseModel):
    driver_id: UUID
    latitude: float
    longitude: float
    speed_kmh: Optional[float]
    heading_deg: Optional[float]
    recorded_at: datetime
    order_id: Optional[UUID]


class TrackingEventResponse(BaseModel):
    id: UUID
    driver_id: UUID
    order_id: Optional[UUID]
    latitude: float
    longitude: float
    speed_kmh: Optional[float]
    recorded_at: datetime
    synced: bool

    model_config = {"from_attributes": True}
