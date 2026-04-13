"""
app/services/tracking.py

GPS ingest service:
- Handles real-time GPS pings from drivers
- Handles offline batch sync when a driver reconnects
- Broadcasts position to the WebSocket hub after persisting

Offline cache design:
  If a driver loses connectivity, their app caches GPS events locally.
  On reconnect, they POST /tracking/gps/batch with all cached events.
  Each event is inserted with synced=True (already synced on arrival).
  The `recorded_at` field stores the original device timestamp.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from geoalchemy2.elements import WKTElement
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tracking import TrackingEvent
from app.schemas.tracking import GPSUpdate


def _make_wkt_point(lat: float, lon: float) -> str:
    """Return a WKT POINT string in EPSG:4326 (lon lat order for PostGIS)."""
    return f"POINT({lon} {lat})"


async def ingest_gps_update(
    payload: GPSUpdate,
    tenant_id: str,
    db: AsyncSession,
) -> TrackingEvent:
    """
    Persist a single real-time GPS update from a driver.

    Returns the created TrackingEvent ORM instance.
    """
    event = TrackingEvent(
        tenant_id=tenant_id,
        order_id=payload.order_id,
        driver_id=payload.driver_id,
        location=WKTElement(_make_wkt_point(payload.latitude, payload.longitude), srid=4326),
        speed_kmh=payload.speed_kmh,
        heading_deg=payload.heading_deg,
        recorded_at=payload.recorded_at,
        synced=True,
        raw_payload=payload.model_dump(mode="json"),
    )
    db.add(event)
    await db.flush()  # Assign DB id without committing (commit handled by get_db)
    return event


async def sync_offline_batch(
    events: list[GPSUpdate],
    tenant_id: str,
    db: AsyncSession,
) -> list[TrackingEvent]:
    """
    Bulk-insert cached GPS events from a driver reconnect.

    All events are inserted with synced=True (they arrive at the server
    over a live connection, even if they were recorded offline).
    Events are sorted by recorded_at to maintain temporal order.
    """
    sorted_events = sorted(events, key=lambda e: e.recorded_at)
    orm_events: list[TrackingEvent] = []

    for payload in sorted_events:
        event = TrackingEvent(
            tenant_id=tenant_id,
            order_id=payload.order_id,
            driver_id=payload.driver_id,
            location=WKTElement(
                _make_wkt_point(payload.latitude, payload.longitude), srid=4326
            ),
            speed_kmh=payload.speed_kmh,
            heading_deg=payload.heading_deg,
            recorded_at=payload.recorded_at,
            synced=True,
            raw_payload=payload.model_dump(mode="json"),
        )
        db.add(event)
        orm_events.append(event)

    await db.flush()
    return orm_events
