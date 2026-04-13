"""
app/schemas/vehicle.py
"""
from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class VehicleCreate(BaseModel):
    plate: str = Field(..., min_length=2, max_length=20)
    model: Optional[str] = Field(default=None, max_length=100)
    max_weight_kg: float = Field(..., gt=0)
    max_volume_m3: float = Field(..., gt=0)


class VehicleUpdate(BaseModel):
    model: Optional[str] = None
    max_weight_kg: Optional[float] = Field(default=None, gt=0)
    max_volume_m3: Optional[float] = Field(default=None, gt=0)
    is_active: Optional[bool] = None


class VehicleResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    plate: str
    model: Optional[str]
    max_weight_kg: float
    max_volume_m3: float
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
