"""
app/services/routing.py

Clarke-Wright Savings Algorithm for last-mile route optimization.

The algorithm produces consolidated routes from a shared depot to multiple
delivery stops, minimising total travel distance while respecting vehicle
capacity constraints.

Reference:
  Clarke, G. & Wright, J.W. (1964). Scheduling of Vehicles from a Central
  Depot to a Number of Delivery Points.

Usage:
    routes = optimize_routes(depot, orders)
    # Returns a list of Route objects, each with an ordered list of stops.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional
from uuid import UUID

from app.services.dispatch import haversine


# ── Data Structures ────────────────────────────────────────────────────────

@dataclass
class Stop:
    order_id: UUID
    lat: float
    lon: float
    weight_kg: float
    volume_m3: float
    address: str


@dataclass
class GeoPoint:
    lat: float
    lon: float


@dataclass
class Route:
    stops: list[Stop] = field(default_factory=list)
    total_weight_kg: float = 0.0
    total_volume_m3: float = 0.0
    total_distance_km: float = 0.0

    def can_add(self, stop: Stop, max_weight: float, max_volume: float) -> bool:
        return (
            self.total_weight_kg + stop.weight_kg <= max_weight
            and self.total_volume_m3 + stop.volume_m3 <= max_volume
        )

    def add_stop(self, stop: Stop) -> None:
        self.stops.append(stop)
        self.total_weight_kg += stop.weight_kg
        self.total_volume_m3 += stop.volume_m3

    def first_stop(self) -> Optional[Stop]:
        return self.stops[0] if self.stops else None

    def last_stop(self) -> Optional[Stop]:
        return self.stops[-1] if self.stops else None


# ── Savings Calculation ────────────────────────────────────────────────────

def _compute_savings(
    depot: GeoPoint,
    stops: list[Stop],
) -> list[tuple[float, int, int]]:
    """
    Compute Clarke-Wright savings S(i,j) for every pair of stops.

    S(i,j) = d(depot→i) + d(depot→j) - d(i→j)

    Returns a list of (savings, i_index, j_index) sorted descending.
    """
    n = len(stops)
    # Distance from depot to each stop
    depot_dist = [
        haversine(depot.lat, depot.lon, s.lat, s.lon) for s in stops
    ]

    savings: list[tuple[float, int, int]] = []
    for i in range(n):
        for j in range(i + 1, n):
            d_ij = haversine(stops[i].lat, stops[i].lon, stops[j].lat, stops[j].lon)
            s = depot_dist[i] + depot_dist[j] - d_ij
            savings.append((s, i, j))

    savings.sort(key=lambda x: x[0], reverse=True)
    return savings


# ── Route Merging ──────────────────────────────────────────────────────────

def optimize_routes(
    depot: GeoPoint,
    stops: list[Stop],
    max_weight_kg: float = 1_000.0,
    max_volume_m3: float = 10.0,
) -> list[Route]:
    """
    Run the Clarke-Wright Savings Algorithm.

    Args:
        depot: The warehouse / depot location.
        stops: List of delivery stops to visit.
        max_weight_kg: Vehicle payload capacity in kg.
        max_volume_m3: Vehicle cargo volume in m³.

    Returns:
        List of Route objects, each representing an optimal delivery run.
        Stops within each route are ordered for sequential delivery.
    """
    if not stops:
        return []

    # Start: each stop is its own single-stop route
    routes: list[Route] = []
    stop_to_route: dict[int, int] = {}  # stop_index → route_index

    for idx, stop in enumerate(stops):
        r = Route()
        r.add_stop(stop)
        stop_to_route[idx] = len(routes)
        routes.append(r)

    # Precompute depot→stop distances for total_distance updates
    depot_dist = [
        haversine(depot.lat, depot.lon, s.lat, s.lon) for s in stops
    ]

    savings = _compute_savings(depot, stops)

    for saving_val, i, j in savings:
        if saving_val <= 0:
            break  # No more beneficial merges

        ri = stop_to_route.get(i)
        rj = stop_to_route.get(j)

        if ri is None or rj is None or ri == rj:
            continue  # Already merged or orphan

        route_i = routes[ri]
        route_j = routes[rj]

        # Merge is valid if:
        # - stop i is at the END of route_i (or route_i has one stop)
        # - stop j is at the START of route_j (or route_j has one stop)
        # - combined route respects capacity constraints
        stop_i = stops[i]
        stop_j = stops[j]

        i_at_end = route_i.last_stop() == stop_i or len(route_i.stops) == 1
        j_at_start = route_j.first_stop() == stop_j or len(route_j.stops) == 1

        if not (i_at_end and j_at_start):
            continue

        combined_weight = route_i.total_weight_kg + route_j.total_weight_kg
        combined_volume = route_i.total_volume_m3 + route_j.total_volume_m3

        if combined_weight > max_weight_kg or combined_volume > max_volume_m3:
            continue

        # Merge route_j into route_i
        for s in route_j.stops:
            route_i.add_stop(s)

        # Update route index mapping for all stops in route_j
        for k, r_idx in stop_to_route.items():
            if r_idx == rj:
                stop_to_route[k] = ri

        # Mark route_j as empty/merged
        routes[rj] = Route()  # Empty sentinel

    # Filter out empty routes and calculate distances
    final_routes: list[Route] = []
    for route in routes:
        if not route.stops:
            continue
        # Total route distance: depot → stops → depot
        dist = 0.0
        prev_lat, prev_lon = depot.lat, depot.lon
        for stop in route.stops:
            dist += haversine(prev_lat, prev_lon, stop.lat, stop.lon)
            prev_lat, prev_lon = stop.lat, stop.lon
        dist += haversine(prev_lat, prev_lon, depot.lat, depot.lon)
        route.total_distance_km = round(dist, 3)
        final_routes.append(route)

    return final_routes
