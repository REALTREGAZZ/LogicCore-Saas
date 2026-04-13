"""
app/main.py
FastAPI application factory with all routers registered, CORS configured,
and a lifespan handler for startup/shutdown events.
"""
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, delivery, orders, tracking, vehicles
from app.api.v1.websocket import router as ws_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan — run DB startup checks here if needed."""
    print(
        f"🚀 LogiCore SaaS starting up | ENV={settings.APP_ENV} | DEBUG={settings.DEBUG}"
    )
    yield
    print("👋 LogiCore SaaS shutting down.")


def create_app() -> FastAPI:
    app = FastAPI(
        title="LogiCore SaaS — Last-Mile Logistics API",
        description=(
            "Multi-tenant B2B logistics backend. "
            "Manage fleets, dispatch drivers, track GPS in real time, "
            "and capture Proof-of-Delivery."
        ),
        version="1.0.0",
        contact={
            "name": "LogiCore Engineering",
            "email": "engineering@logicore.io",
        },
        license_info={"name": "Proprietary"},
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # ── CORS ─────────────────────────────────────────────────────────────────
    # Restrict to your actual frontend domains in production
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if settings.DEBUG else ["https://app.logicore.io"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── REST Routers ──────────────────────────────────────────────────────────
    api_prefix = "/api/v1"
    app.include_router(auth.router, prefix=api_prefix)
    app.include_router(orders.router, prefix=api_prefix)
    app.include_router(tracking.router, prefix=api_prefix)
    app.include_router(vehicles.router, prefix=api_prefix)
    app.include_router(delivery.router, prefix=api_prefix)

    # ── WebSocket Router ──────────────────────────────────────────────────────
    app.include_router(ws_router, prefix=api_prefix)

    @app.get("/health", tags=["System"], summary="Health check")
    async def health() -> dict:
        return {"status": "ok", "env": settings.APP_ENV}

    return app


app = create_app()
