# MetroPulse AI — Backend Service

Backend API service for MetroPulse AI: Real-Time Metro Platform Crowd Detection, Short-Term Forecasting, Commuter Reporting & Alert Dispatch.

---

## Architecture Overview

Built with **FastAPI**, **Pydantic v2**, and **Python 3.11+**, designed for high throughput, CPU-friendly ML execution, and seamless integration with Supabase PostgreSQL and edge video cameras.

```
backend/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── stations.py      # Station catalog & platform metadata
│   │   │   ├── journeys.py      # Metro route planning & shortest path
│   │   │   ├── crowd.py         # Real-time observations, trends, counts
│   │   │   ├── predictions.py   # Short-term AI forecasting (5/10/15m)
│   │   │   ├── reports.py       # Commuter crowd reporting & rate limiting
│   │   │   ├── alerts.py        # Active operational advisories & transitions
│   │   │   └── videos.py        # Video uploads & background YOLO queue
│   │   └── dependencies.py      # DB & Auth injection
│   ├── core/
│   │   ├── config.py            # Pydantic BaseSettings environment loader
│   │   ├── security.py          # JWT & Header validation
│   │   └── logging.py           # Sanitized structured logging
│   ├── schemas/                 # Strongly typed Pydantic models
│   ├── services/                # Core business logic layer
│   ├── integrations/
│   │   ├── supabase_client.py   # Supabase client with local prototype fallback
│   │   └── ml_client.py         # YOLO11 person detection & sklearn forecaster
│   ├── utils/
│   │   ├── timestamps.py        # Timezone-aware ISO 8601 & freshness checks
│   │   └── validation.py        # Input sanitization & video file safety
│   └── main.py                  # FastAPI application entrypoint
├── scripts/
│   └── import_metro_data.py     # Static DMRC GTFS & station data loader
├── tests/                       # Complete pytest suite
├── .env.example
├── requirements.txt
└── README.md
```

---

## Local Setup (Windows)

### 1. Prerequisites
- Python 3.11+ installed and accessible via PATH
- Node.js 18+ (for frontend dashboard)

### 2. Environment & Dependencies
```powershell
cd MetroPulse-AI/backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
```

### 3. Configuration
Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```
*(Supabase credentials are optional for development; the backend automatically falls back to an in-memory prototype catalog if credentials are not configured).*

### 4. Running the Backend Server
```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive OpenAPI documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

---

## Running Automated Tests

Run the test suite with pytest:
```powershell
python -m pytest -v
```

---

## Station Data Import CLI

To validate and import static Delhi Metro and GTFS pathway datasets:
```powershell
# Dry run validation
python scripts/import_metro_data.py --dry-run

# Commit to Supabase (when SUPABASE_URL and SUPABASE_ANON_KEY are set)
python scripts/import_metro_data.py --commit
```

---

## ML Integration & CPU Performance

- **YOLO11 Nano (`yolo11n.pt`)**: Lazy-loaded on CPU with frame sampling (1 in 5 frames) to ensure smooth 60fps responsiveness on standard 16GB laptops without dedicated GPU.
- **Short-Term Predictions**: Employs trained scikit-learn models (`RandomForestRegressor` and `LinearRegression`) for 5, 10, and 15-minute horizons.
- **Freshness & Safeguards**: Observations older than 5 minutes are marked `stale`; observations older than 15 minutes expire and return `unavailable` rather than reporting false low crowd counts.
