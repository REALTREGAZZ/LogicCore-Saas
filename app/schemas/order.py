"""
app/schemas/order.py
Pydantic schemas for order creation, updates, and API responses.
Coordinates are passed as (lat, lon) floats and converted to WKT in the service layer.
"""
from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class GeoPoint(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class OrderCreate(BaseModel):
    pickup_location: GeoPoint
    delivery_location: GeoPoint
    pickup_address: str = Field(..., max_length=500)
    delivery_address: str = Field(..., max_length=500)
    weight_kg: float = Field(..., gt=0)
    volume_m3: float = Field(..., gt=0)
    priority: int = Field(default=5, ge=1, le=10)
    delivery_window_start: Optional[datetime] = None
    delivery_window_end: Optional[datetime] = None


class OrderUpdate(BaseModel):
    status: Optional[str] = Field(
        default=None,
        pattern=r"^(pending|assigned|in_transit|delivered|incident)$",
    )
    driver_id: Optional[UUID] = None
    vehicle_id: Optional[UUID] = None
    priority: Optional[int] = Field(default=None, ge=1, le=10)


class OrderResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    driver_id: Optional[UUID]
    vehicle_id: Optional[UUID]
    pickup_address: str
    delivery_address: str
    pickup_lat: float
    pickup_lon: float
    delivery_lat: float
    delivery_lon: float
    weight_kg: float
    volume_m3: float
    status: str
    priority: int
    delivery_window_start: Optional[datetime]
    delivery_window_end: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DispatchRequest(BaseModel):
    """Trigger the smart dispatch engine for a single order."""
    order_id: UUID


class RouteOptimizationRequest(BaseModel):
    """Run Clarke-Wright on a list of pending order IDs."""
    order_ids: list[UUID] = Field(..., min_length=2)
    depot_lat: float = Field(..., ge=-90, le=90)
    depot_lon: float = Field(..., ge=-180, le=180)
