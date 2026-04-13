"""
app/api/v1/websocket.py

Real-time WebSocket hub for the dispatcher dashboard.

Architecture:
  - ConnectionManager holds per-tenant lists of active WebSocket connections.
  - Dispatchers connect with a valid JWT in the query string.
  - When a GPS update arrives via the REST API, it calls manager.broadcast()
    which fans out to all dispatcher sockets in the same tenant.
  - Graceful disconnect: connection is removed silently; driver state persists in DB.

Usage (client):
  wscat -c "ws://localhost:8000/api/v1/ws/dispatch/{tenant_id}?token=<jwt>"
"""
from __future__ import annotations

import json
from collections import defaultdict
from typing import Any

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from app.core.security import decode_token

router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    """Manages WebSocket connections, bucketed by tenant_id."""

    def __init__(self) -> None:
        # tenant_id (str) → set of active WebSocket connections
        self._rooms: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, tenant_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self._rooms[tenant_id].add(ws)

    def disconnect(self, tenant_id: str, ws: WebSocket) -> None:
        self._rooms[tenant_id].discard(ws)
        if not self._rooms[tenant_id]:
            del self._rooms[tenant_id]

    async def broadcast(self, tenant_id: str, message: dict[str, Any]) -> None:
        """Send a JSON message to all dispatchers in a tenant room."""
        dead: list[WebSocket] = []
        for ws in list(self._rooms.get(tenant_id, set())):
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                dead.append(ws)

        # Clean up broken connections
        for ws in dead:
            self.disconnect(tenant_id, ws)


# Module-level singleton — shared across the entire application lifetime
manager = ConnectionManager()


@router.websocket("/ws/dispatch/{tenant_id}")
async def websocket_dispatch(
    tenant_id: str,
    ws: WebSocket,
    token: str = Query(..., description="JWT access token"),
) -> None:
    """
    WebSocket endpoint for the dispatcher dashboard.

    The client must supply a valid JWT via the `token` query parameter.
    Once connected, the client receives real-time GPS update messages
    as JSON objects whenever a driver submits a GPS ping.

    Message format (server → client):
    {
      "type": "gps_update",
      "driver_id": "uuid",
      "order_id": "uuid | null",
      "latitude": 40.4168,
      "longitude": -3.7038,
      "speed_kmh": 55.2,
      "heading_deg": 270.0,
      "recorded_at": "2026-04-12T19:00:00Z"
    }
    """
    # Validate JWT before accepting
    try:
        payload = decode_token(token)
        token_tenant_id = payload.get("tenant_id", "")
    except Exception:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Verify the tenant_id in the URL matches the one in the token
    if token_tenant_id != tenant_id:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(tenant_id, ws)
    try:
        # Keep the connection alive — listen for client pings or close events
        while True:
            data = await ws.receive_text()
            # Echo heartbeat messages back (optional keep-alive)
            if data == "ping":
                await ws.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(tenant_id, ws)
