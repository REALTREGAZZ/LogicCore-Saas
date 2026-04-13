"""
tests/test_dispatch.py
Unit tests for the smart dispatch engine.
No database required — uses pure-Python logic.
"""
import math
import pytest

from app.services.dispatch import haversine
from app.services.routing import GeoPoint, Stop, optimize_routes


# ── Haversine Tests ────────────────────────────────────────────────────────

class TestHaversine:
    def test_same_point_is_zero(self):
        assert haversine(40.0, -3.0, 40.0, -3.0) == pytest.approx(0.0, abs=1e-6)

    def test_known_distance_madrid_to_barcelona(self):
        # Madrid: 40.4168°N, 3.7038°W  |  Barcelona: 41.3851°N, 2.1734°E
        dist = haversine(40.4168, -3.7038, 41.3851, 2.1734)
        # Actual straight-line distance ≈ 505 km
        assert 490 < dist < 520, f"Expected ~505 km, got {dist:.1f} km"

    def test_symmetry(self):
        d1 = haversine(51.5074, -0.1278, 48.8566, 2.3522)
        d2 = haversine(48.8566, 2.3522, 51.5074, -0.1278)
        assert d1 == pytest.approx(d2, rel=1e-5)

    def test_north_pole_to_equator(self):
        # ~10,007 km (quarter of Earth's circumference)
        dist = haversine(90.0, 0.0, 0.0, 0.0)
        assert 9_900 < dist < 10_100

    def test_returns_float(self):
        result = haversine(0.0, 0.0, 1.0, 1.0)
        assert isinstance(result, float)


# ── Clarke-Wright Tests ────────────────────────────────────────────────────

class TestClarkeWright:
    def _make_depot(self) -> GeoPoint:
        return GeoPoint(lat=40.4168, lon=-3.7038)  # Madrid

    def _make_stops(self) -> list[Stop]:
        from uuid import uuid4
        return [
            Stop(order_id=uuid4(), lat=40.5000, lon=-3.6000, weight_kg=100, volume_m3=1.0, address="Stop A"),
            Stop(order_id=uuid4(), lat=40.5100, lon=-3.5900, weight_kg=150, volume_m3=1.5, address="Stop B"),
            Stop(order_id=uuid4(), lat=41.3851, lon=2.1734,  weight_kg=800, volume_m3=8.0, address="Stop C — Barcelona"),
        ]

    def test_returns_at_least_one_route(self):
        routes = optimize_routes(self._make_depot(), self._make_stops())
        assert len(routes) >= 1

    def test_all_stops_appear_in_routes(self):
        stops = self._make_stops()
        routes = optimize_routes(self._make_depot(), stops)
        visited_ids = {s.order_id for r in routes for s in r.stops}
        expected_ids = {s.order_id for s in stops}
        assert visited_ids == expected_ids

    def test_capacity_respected(self):
        from uuid import uuid4
        # Two stops that together exceed max_weight (300 > 250)
        stops = [
            Stop(order_id=uuid4(), lat=40.5, lon=-3.6, weight_kg=200, volume_m3=1.0, address="Heavy A"),
            Stop(order_id=uuid4(), lat=40.6, lon=-3.5, weight_kg=200, volume_m3=1.0, address="Heavy B"),
        ]
        depot = GeoPoint(lat=40.4168, lon=-3.7038)
        routes = optimize_routes(depot, stops, max_weight_kg=250, max_volume_m3=10.0)
        for route in routes:
            assert route.total_weight_kg <= 250

    def test_single_stop_gives_one_route(self):
        from uuid import uuid4
        stops = [
            Stop(order_id=uuid4(), lat=40.5, lon=-3.6, weight_kg=50, volume_m3=0.5, address="Only Stop"),
        ]
        routes = optimize_routes(self._make_depot(), stops)
        assert len(routes) == 1
        assert len(routes[0].stops) == 1

    def test_empty_stops_returns_empty(self):
        routes = optimize_routes(self._make_depot(), [])
        assert routes == []

    def test_routes_have_positive_distance(self):
        routes = optimize_routes(self._make_depot(), self._make_stops())
        for route in routes:
            assert route.total_distance_km > 0
