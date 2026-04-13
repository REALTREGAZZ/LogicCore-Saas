"""
app/api/v1/orders.py

Order management + dispatch trigger + route optimization.
All endpoints are tenant-scoped via the JWT dependency.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from geoalchemy2.elements import WKTElement
from geoalchemy2.functions import ST_AsText, ST_X, ST_Y
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db, require_dispatcher
from app.models.order import Order
from app.models.tracking import TrackingEvent
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderUpdate,
    RouteOptimizationRequest,
)
from app.services.dispatch import assign_order_to_driver
from app.services.routing import GeoPoint, Stop, optimize_routes

router = APIRouter(prefix="/orders", tags=["Orders"])


def _wkt_point(lat: float, lon: float) -> WKTElement:
    return WKTElement(f"POINT({lon} {lat})", srid=4326)


async def _order_to_response(order: Order, db: AsyncSession) -> OrderResponse:
    """Convert ORM Order to OrderResponse, extracting lat/lon from PostGIS."""
    pickup_wkt = (
        await db.execute(
            select(ST_AsText(Order.pickup_location)).where(Order.id == order.id)
        )
    ).scalar_one_or_none() or "POINT(0 0)"

    delivery_wkt = (
        await db.execute(
            select(ST_AsText(Order.delivery_location)).where(Order.id == order.id)
        )
    ).scalar_one_or_none() or "POINT(0 0)"

    def parse_wkt(wkt: str) -> tuple[float, float]:
        coords = wkt.replace("POINT(", "").replace(")", "").split()
        return float(coords[1]), float(coords[0])  # lat, lon

    p_lat, p_lon = parse_wkt(pickup_wkt)
    d_lat, d_lon = parse_wkt(delivery_wkt)

    return OrderResponse(
        id=order.id,
        tenant_id=order.tenant_id,
        driver_id=order.driver_id,
        vehicle_id=order.vehicle_id,
        pickup_address=order.pickup_address,
        delivery_address=order.delivery_address,
        pickup_lat=p_lat,
        pickup_lon=p_lon,
        delivery_lat=d_lat,
        delivery_lon=d_lon,
        weight_kg=float(order.weight_kg),
        volume_m3=float(order.volume_m3),
        status=order.status,
        priority=order.priority,
        delivery_window_start=order.delivery_window_start,
        delivery_window_end=order.delivery_window_end,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


@router.post(
    "/",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new delivery order",
)
async def create_order(
    body: OrderCreate,
    current_user: User = Depends(require_dispatcher),
    db: AsyncSession = Depends(get_db),
) -> OrderResponse:
    order = Order(
        tenant_id=current_user.tenant_id,
        pickup_location=_wkt_point(
            body.pickup_location.latitude, body.pickup_location.longitude
        ),
        delivery_location=_wkt_point(
            body.delivery_location.latitude, body.delivery_location.longitude
        ),
        pickup_address=body.pickup_address,
        delivery_address=body.delivery_address,
        weight_kg=body.weight_kg,
        volume_m3=body.volume_m3,
        priority=body.priority,
        delivery_window_start=body.delivery_window_start,
        delivery_window_end=body.delivery_window_end,
    )
    db.add(order)
    await db.flush()
    return await _order_to_response(order, db)


@router.get(
    "/",
    response_model=list[OrderResponse],
    summary="List all orders for the authenticated tenant",
)
async def list_orders(
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[OrderResponse]:
    query = select(Order).where(Order.tenant_id == current_user.tenant_id)
    if status_filter:
        query = query.where(Order.status == status_filter)
    query = query.order_by(Order.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    orders = result.scalars().all()
    return [await _order_to_response(o, db) for o in orders]


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="Get a single order by ID",
)
async def get_order(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderResponse:
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.tenant_id == current_user.tenant_id,
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return await _order_to_response(order, db)


@router.patch(
    "/{order_id}",
    response_model=OrderResponse,
    summary="Update order status, driver, or vehicle assignment",
)
async def update_order(
    order_id: uuid.UUID,
    body: OrderUpdate,
    current_user: User = Depends(require_dispatcher),
    db: AsyncSession = Depends(get_db),
) -> OrderResponse:
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.tenant_id == current_user.tenant_id,
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if body.status is not None:
        order.status = body.status
    if body.driver_id is not None:
        order.driver_id = body.driver_id
    if body.vehicle_id is not None:
        order.vehicle_id = body.vehicle_id
    if body.priority is not None:
        order.priority = body.priority

    order.updated_at = datetime.now(timezone.utc)
    await db.flush()
    return await _order_to_response(order, db)


@router.post(
    "/{order_id}/dispatch",
    response_model=OrderResponse,
    summary="Run the smart dispatch engine to assign a driver to this order",
)
async def dispatch_order(
    order_id: uuid.UUID,
    current_user: User = Depends(require_dispatcher),
    db: AsyncSession = Depends(get_db),
) -> OrderResponse:
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.tenant_id == current_user.tenant_id,
            Order.status == "pending",
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending order not found.",
        )

    driver_id = await assign_order_to_driver(order, db)
    if driver_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No eligible driver found. Check vehicle capacity and driver availability.",
        )

    order.driver_id = driver_id
    order.status = "assigned"
    order.updated_at = datetime.now(timezone.utc)
    await db.flush()

    return await _order_to_response(order, db)


@router.post(
    "/optimize-routes",
    summary="Run Clarke-Wright Savings Algorithm on a set of pending orders",
)
async def optimize_order_routes(
    body: RouteOptimizationRequest,
    current_user: User = Depends(require_dispatcher),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    # Load orders
    result = await db.execute(
        select(Order).where(
            Order.id.in_(body.order_ids),
            Order.tenant_id == current_user.tenant_id,
        )
    )
    orders = list(result.scalars().all())

    if len(orders) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least 2 orders are required for route optimization.",
        )

    # Convert orders to Stop objects
    stops: list[Stop] = []
    for order in orders:
        wkt = (
            await db.execute(
                select(ST_AsText(Order.delivery_location)).where(Order.id == order.id)
            )
        ).scalar_one_or_none() or "POINT(0 0)"
        coords = wkt.replace("POINT(", "").replace(")", "").split()
        stops.append(
            Stop(
                order_id=order.id,
                lat=float(coords[1]),
                lon=float(coords[0]),
                weight_kg=float(order.weight_kg),
                volume_m3=float(order.volume_m3),
                address=order.delivery_address,
            )
        )

    depot = GeoPoint(lat=body.depot_lat, lon=body.depot_lon)
    routes = optimize_routes(depot, stops)

    return {
        "total_routes": len(routes),
        "routes": [
            {
                "route_index": idx,
                "total_distance_km": r.total_distance_km,
                "total_weight_kg": float(r.total_weight_kg),
                "total_volume_m3": float(r.total_volume_m3),
                "stops": [
                    {
                        "order_id": str(s.order_id),
                        "address": s.address,
                        "lat": s.lat,
                        "lon": s.lon,
                    }
                    for s in r.stops
                ],
            }
            for idx, r in enumerate(routes)
        ],
    }
