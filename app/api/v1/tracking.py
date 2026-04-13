"""
app/api/v1/tracking.py

GPS tracking endpoints:
  POST /tracking/gps         — Single real-time GPS update
  POST /tracking/gps/batch   — Offline batch sync on driver reconnect
  GET  /tracking/drivers/live — Last known position of all active drivers
"""
from __future__ import annotations

import uuid
from datetime import timezone

from fastapi import APIRouter, Depends, status
from geoalchemy2.functions import ST_AsText
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.tracking import TrackingEvent
from app.models.user import User
from app.schemas.tracking import (
    DriverLivePosition,
    GPSBatchUpdate,
    GPSUpdate,
    TrackingEventResponse,
)
from app.services.tracking import ingest_gps_update, sync_offline_batch

# Import WebSocket manager for broadcasting
from app.api.v1.websocket import manager

router = APIRouter(prefix="/tracking", tags=["GPS Tracking"])


@router.post(
    "/gps",
    response_model=TrackingEventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a real-time GPS update from a driver",
)
async def post_gps_update(
    body: GPSUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TrackingEventResponse:
    event = await ingest_gps_update(
        payload=body,
        tenant_id=str(current_user.tenant_id),
        db=db,
    )
    await db.flush()

    # Broadcast to WebSocket dispatcher dashboard for this tenant
    await manager.broadcast(
        tenant_id=str(current_user.tenant_id),
        message={
            "type": "gps_update",
            "driver_id": str(body.driver_id),
            "order_id": str(body.order_id) if body.order_id else None,
            "latitude": body.latitude,
            "longitude": body.longitude,
            "speed_kmh": body.speed_kmh,
            "heading_deg": body.heading_deg,
            "recorded_at": body.recorded_at.isoformat(),
        },
    )

    return TrackingEventResponse(
        id=event.id,
        driver_id=event.driver_id,
        order_id=event.order_id,
        latitude=body.latitude,
        longitude=body.longitude,
        speed_kmh=float(body.speed_kmh) if body.speed_kmh else None,
        recorded_at=event.recorded_at,
        synced=event.synced,
    )


@router.post(
    "/gps/batch",
    summary="Bulk-sync offline GPS events after driver reconnects",
)
async def post_gps_batch(
    body: GPSBatchUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    events = await sync_offline_batch(
        events=body.events,
        tenant_id=str(current_user.tenant_id),
        db=db,
    )
    return {"synced_events": len(events)}


@router.get(
    "/drivers/live",
    response_model=list[DriverLivePosition],
    summary="Get the last known GPS position of every active driver in the tenant",
)
async def get_live_driver_positions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[DriverLivePosition]:
    """
    Returns one position per driver — the most recent TrackingEvent.
    Uses a subquery to get the max recorded_at per driver, then joins.
    """
    # Subquery: latest recorded_at per driver for this tenant
    subq = (
        select(
            TrackingEvent.driver_id,
            func.max(TrackingEvent.recorded_at).label("max_recorded_at"),
        )
        .where(TrackingEvent.tenant_id == current_user.tenant_id)
        .group_by(TrackingEvent.driver_id)
        .subquery()
    )

    result = await db.execute(
        select(TrackingEvent).join(
            subq,
            and_(
                TrackingEvent.driver_id == subq.c.driver_id,
                TrackingEvent.recorded_at == subq.c.max_recorded_at,
            ),
        )
    )
    events = list(result.scalars().all())

    positions: list[DriverLivePosition] = []
    for event in events:
        wkt = (
            await db.execute(
                select(ST_AsText(TrackingEvent.location)).where(
                    TrackingEvent.id == event.id
                )
            )
        ).scalar_one_or_none() or "POINT(0 0)"
        coords = wkt.replace("POINT(", "").replace(")", "").split()
        positions.append(
            DriverLivePosition(
                driver_id=event.driver_id,
                latitude=float(coords[1]),
                longitude=float(coords[0]),
                speed_kmh=float(event.speed_kmh) if event.speed_kmh else None,
                heading_deg=float(event.heading_deg) if event.heading_deg else None,
                recorded_at=event.recorded_at,
                order_id=event.order_id,
            )
        )
    return positions
