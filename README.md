# LogiCore SaaS — Last-Mile Logistics Backend

Production-ready Python backend for a multi-tenant B2B logistics platform.

## Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI (async) |
| Database | PostgreSQL + PostGIS |
| ORM | SQLAlchemy 2 (asyncio) |
| Migrations | Alembic (async) |
| Auth | JWT (python-jose) + bcrypt |
| Real-time | WebSockets (per-tenant rooms) |
| File Storage | Cloudinary |
| Testing | pytest + pytest-asyncio |

## Quick Start

### 1. Prerequisites
```bash
# PostgreSQL with PostGIS extension
sudo apt install postgresql postgis
# Or via Docker:
docker run -d -e POSTGRES_PASSWORD=pass -p 5432:5432 postgis/postgis:16-3.4
```

### 2. Setup
```bash
cd "logistic saas"
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Copy and fill in your credentials
cp .env.example .env
```

### 3. Run Migrations
```bash
# Create the DB
createdb logicore_db
psql logicore_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Generate and apply migrations
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

### 4. Start the Server
```bash
uvicorn app.main:app --reload
```

Open **http://localhost:8000/docs** for the interactive Swagger UI.

### 5. Run Tests (no DB required)
```bash
pytest tests/ -v
```

## Project Structure

```
logistic saas/
├── app/
│   ├── main.py                 # FastAPI app factory
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py         # Register / Login → JWT
│   │       ├── orders.py       # CRUD + dispatch + route optimization
│   │       ├── tracking.py     # GPS ingest + batch sync + live positions
│   │       ├── vehicles.py     # Fleet management
│   │       ├── delivery.py     # Proof-of-Delivery upload
│   │       └── websocket.py    # Real-time dispatcher WebSocket hub
│   ├── core/
│   │   ├── config.py           # Pydantic Settings (reads .env)
│   │   ├── database.py         # Async SQLAlchemy engine + get_db()
│   │   ├── security.py         # JWT + bcrypt + multi-tenant dependency
│   │   └── dependencies.py     # Re-exports for clean router imports
│   ├── models/
│   │   ├── tenant.py           # Company / Tenant
│   │   ├── user.py             # Dispatcher & Driver
│   │   ├── vehicle.py          # Fleet vehicle (weight + volume capacity)
│   │   ├── order.py            # Delivery order (PostGIS geometry)
│   │   ├── tracking.py         # GPS events + offline cache flag
│   │   └── proof_of_delivery.py# Photo URL + digital signature
│   ├── schemas/                # Pydantic request/response schemas
│   └── services/
│       ├── dispatch.py         # Haversine + scoring → assign driver
│       ├── routing.py          # Clarke-Wright Savings Algorithm
│       ├── tracking.py         # GPS ingest + offline batch sync
│       └── storage.py          # Cloudinary photo + signature upload
├── alembic/
│   └── env.py                  # Async Alembic config
├── tests/
│   └── test_dispatch.py        # Unit tests for Haversine + Clarke-Wright
├── alembic.ini
├── pytest.ini
├── requirements.txt
└── .env.example
```

## Key Features

### 🚀 Smart Dispatch Engine
`POST /api/v1/orders/{id}/dispatch`  
Assigns the best driver based on:
- **Haversine distance** from driver's last GPS to pickup
- **Vehicle capacity** (weight + volume must fit the order)
- **Priority** (1 = urgent, 10 = low)
- **Delivery window urgency** (hours remaining)

### 🗺️ Route Optimization
`POST /api/v1/orders/optimize-routes`  
Runs **Clarke-Wright Savings Algorithm** on a batch of orders:
- Computes savings S(i,j) = d(depot→i) + d(depot→j) – d(i→j)
- Merges routes greedily respecting vehicle weight + volume capacity
- Returns optimized stop sequences with total km per route

### 📡 Real-Time WebSocket Dashboard
```
ws://localhost:8000/api/v1/ws/dispatch/{tenant_id}?token=<jwt>
```
- Per-tenant isolated rooms
- Receives GPS updates broadcast by REST endpoint in real time
- Heartbeat: send `ping` → receive `pong`

### 📸 Proof of Delivery
`POST /api/v1/delivery/{order_id}/pod`  
- Multipart image upload → Cloudinary
- Optional base64 digital signature
- GPS coordinates at delivery
- Automatically marks order as `delivered`

### 🔌 Offline GPS Sync
If a driver loses connectivity, their app caches pings locally.  
On reconnect: `POST /api/v1/tracking/gps/batch`  
All events are stored with original device timestamps (`recorded_at`).

## Security
- JWT tokens embed `tenant_id` — all queries are automatically scoped
- Passwords hashed with bcrypt (cost factor 12)
- No secrets in code — all credentials in `.env` (git-ignored)
- CORS restricted to production domain in non-debug mode
