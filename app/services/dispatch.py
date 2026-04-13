"""
app/services/dispatch.py

Smart Dispatch Engine — assigns a pending order to the best available driver.

Scoring formula (lower = better):
  score = (haversine_km * 0.5) + (priority * 10) + (window_urgency_hours * 2)

Steps:
  1. Fetch drivers with IS_ACTIVE=True and role='driver'
  2. Filter by vehicle capacity (weight and volume)
  3. Get each driver's last known GPS position
  4. Compute Haversine distance from driver to pickup
  5. Factor in order priority and delivery window urgency
  6. Assign the driver with the lowest score
"""
from __future__ import annotations

import math
import uuid
from datetime import datetime, timezone
from typing import Optional

from geoalchemy2.functions import ST_AsText
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from app.models.tracking import TrackingEvent
from app.models.user import User
from app.models.vehicle import Vehicle


# ── Haversine Formula ──────────────────────────────────────────────────────

_EARTH_RADIUS_KM = 6371.0


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Return the great-circle distance in kilometres between two GPS points.

    Args:
        lat1, lon1: Origin coordinates (decimal degrees)
        lat2, lon2: Destination coordinates (decimal degrees)

    Returns:
        Distance in kilometres.
    """
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    return _EARTH_RADIUS_KM * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── Driver Position Cache ──────────────────────────────────────────────────

async def get_driver_last_position(
    driver_id: uuid.UUID, db: AsyncSession
) -> Optional[tuple[float, float]]:
    """Return (lat, lon) of the driver's most recent GPS ping, or None."""
    result = await db.execute(
        select(TrackingEvent)
        .where(TrackingEvent.driver_id == driver_id)
        .order_by(TrackingEvent.recorded_at.desc())
        .limit(1)
    )
    event = result.scalar_one_or_none()
    if event is None:
        return None

    # Extract WKT from PostGIS geometry, e.g. "POINT(-3.7038 40.4168)"
    wkt_result = await db.execute(
        select(ST_AsText(TrackingEvent.location)).where(
            TrackingEvent.id == event.id
        )
    )
    wkt: Optional[str] = wkt_result.scalar_one_or_none()
    if wkt is None:
        return None

    # Parse "POINT(lon lat)" → (lat, lon)
    coords_str = wkt.replace("POINT(", "").replace(")", "")
    lon_s, lat_s = coords_str.split()
    return float(lat_s), float(lon_s)


# ── Window Urgency ─────────────────────────────────────────────────────────

def _window_urgency_hours(order: Order) -> float:
    """Hours until the delivery window closes (0 if no window set)."""
    if order.delivery_window_end is None:
        return 0.0
    now = datetime.now(timezone.utc)
    delta = (order.delivery_window_end - now).total_seconds() / 3600
    return max(0.0, delta)


# ── Main Dispatch Function ─────────────────────────────────────────────────

async def assign_order_to_driver(
    order: Order,
    db: AsyncSession,
) -> Optional[uuid.UUID]:
    """
    Find the best driver for an order using a composite scoring function.

    Returns the UUID of the assigned driver, or None if no eligible driver
    is found.
    """
    tenant_id = order.tenant_id

    # 1. Get all active drivers for this tenant
    driver_result = await db.execute(
        select(User).where(
            and_(
                User.tenant_id == tenant_id,
                User.role == "driver",
                User.is_active.is_(True),
            )
        )
    )
    drivers: list[User] = list(driver_result.scalars().all())
    if not drivers:
        return None

    # 2. Filter drivers by vehicle capacity
    #    A driver is eligible if their assigned vehicle meets the order's requirements.
    eligible: list[tuple[User, float, float]] = []  # (driver, dist_km, score)

    # Fetch pickup coordinates from PostGIS
    pickup_wkt_result = await db.execute(
        select(ST_AsText(Order.pickup_location)).where(Order.id == order.id)
    )
    pickup_wkt: Optional[str] = pickup_wkt_result.scalar_one_or_none()
    if not pickup_wkt:
        return None

    pickup_lon_s, pickup_lat_s = (
        pickup_wkt.replace("POINT(", "").replace(")", "").split()
    )
    pickup_lat = float(pickup_lat_s)
    pickup_lon = float(pickup_lon_s)

    urgency = _window_urgency_hours(order)

    for driver in drivers:
        # Check if there is a vehicle associated with this driver
        vehicle_result = await db.execute(
            select(Vehicle).where(
                and_(
                    Vehicle.tenant_id == tenant_id,
                    Vehicle.is_active.is_(True),
                    Vehicle.max_weight_kg >= order.weight_kg,
                    Vehicle.max_volume_m3 >= order.volume_m3,
                )
            )
        )
        vehicle = vehicle_result.scalars().first()
        if vehicle is None:
            continue  # No eligible vehicle for this driver

        # Get driver's last known position
        position = await get_driver_last_position(driver.id, db)
        if position is None:
            # Driver has no GPS history — assign a large penalty distance
            dist_km = 9999.0
        else:
            dist_km = haversine(position[0], position[1], pickup_lat, pickup_lon)

        # Scoring: lower is better
        score = (dist_km * 0.5) + (order.priority * 10) + (urgency * 2)
        eligible.append((driver, dist_km, score))

    if not eligible:
        return None

    # Pick driver with the lowest score
    best_driver, _, _ = min(eligible, key=lambda x: x[2])
    return best_driver.id
