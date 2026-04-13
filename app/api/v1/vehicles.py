"""
app/api/v1/vehicles.py

Fleet management endpoints.
Only dispatchers can create/update vehicles.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db, require_dispatcher
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleResponse, VehicleUpdate

router = APIRouter(prefix="/vehicles", tags=["Fleet Management"])


@router.post(
    "/",
    response_model=VehicleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new vehicle in the fleet",
)
async def create_vehicle(
    body: VehicleCreate,
    current_user: User = Depends(require_dispatcher),
    db: AsyncSession = Depends(get_db),
) -> VehicleResponse:
    vehicle = Vehicle(
        tenant_id=current_user.tenant_id,
        plate=body.plate,
        model=body.model,
        max_weight_kg=body.max_weight_kg,
        max_volume_m3=body.max_volume_m3,
    )
    db.add(vehicle)
    await db.flush()
    return VehicleResponse.model_validate(vehicle)


@router.get(
    "/",
    response_model=list[VehicleResponse],
    summary="List all vehicles in the tenant fleet",
)
async def list_vehicles(
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[VehicleResponse]:
    query = select(Vehicle).where(Vehicle.tenant_id == current_user.tenant_id)
    if active_only:
        query = query.where(Vehicle.is_active.is_(True))
    result = await db.execute(query.order_by(Vehicle.plate))
    return [VehicleResponse.model_validate(v) for v in result.scalars().all()]


@router.patch(
    "/{vehicle_id}",
    response_model=VehicleResponse,
    summary="Update vehicle details or deactivate it",
)
async def update_vehicle(
    vehicle_id: uuid.UUID,
    body: VehicleUpdate,
    current_user: User = Depends(require_dispatcher),
    db: AsyncSession = Depends(get_db),
) -> VehicleResponse:
    result = await db.execute(
        select(Vehicle).where(
            Vehicle.id == vehicle_id,
            Vehicle.tenant_id == current_user.tenant_id,
        )
    )
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    if body.model is not None:
        vehicle.model = body.model
    if body.max_weight_kg is not None:
        vehicle.max_weight_kg = body.max_weight_kg
    if body.max_volume_m3 is not None:
        vehicle.max_volume_m3 = body.max_volume_m3
    if body.is_active is not None:
        vehicle.is_active = body.is_active

    await db.flush()
    return VehicleResponse.model_validate(vehicle)
