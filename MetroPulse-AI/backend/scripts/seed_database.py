"""Complete Database Seeding Script for MetroPulse AI.

Owned by Backend & Database integration.
Populates:
1. Stations & Platforms (Delhi Metro Network)
2. Routes & Interchanges
3. Sample Crowd Observations
4. Active & Historical Predictions
5. Active Alerts & Safety Reports

Usage:
    python scripts/seed_database.py
"""

from datetime import datetime, timezone, timedelta
from pathlib import Path
import sys
import uuid

# Ensure backend root is on sys.path
BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings
from app.core.logging import logger
from app.integrations.supabase_client import supabase_manager
from scripts.import_metro_data import parse_stations_csv, parse_routes_csv


def seed_database():
    print("=" * 65)
    print("METROPULSE AI — DATABASE SEEDING UTILITY")
    print("=" * 65)

    if not supabase_manager.is_configured:
        print("[!] Supabase client is NOT configured with live credentials.")
        print("    Please set SUPABASE_URL and SUPABASE_ANON_KEY (or SERVICE_ROLE_KEY)")
        print("    in your MetroPulse-AI/backend/.env file to run this script.")
        print("=" * 65)
        return False

    client = supabase_manager.client
    now = datetime.now(timezone.utc)
    static_dir = settings.DATA_STATIC_DIR

    print(f"[*] Target Supabase: {settings.SUPABASE_URL}")
    print("[1/5] Importing Stations & Platforms...")

    stations, _ = parse_stations_csv(static_dir / "delhi_metro_stations.csv")
    valid_station_ids = {s["id"] for s in stations}

    for s in stations:
        client.table("stations").upsert(s).execute()

    KNOWN_PLATFORMS = {
        "stn-001": [
            {"id": "plt-001-Y", "station_id": "stn-001", "name": "Platform 1", "direction": "Yellow Line – Northbound", "nominal_capacity": 450},
            {"id": "plt-001-B", "station_id": "stn-001", "name": "Platform 2", "direction": "Blue Line – Eastbound", "nominal_capacity": 400},
        ],
        "stn-002": [
            {"id": "plt-002-Y", "station_id": "stn-002", "name": "Platform 1", "direction": "Yellow Line – Northbound", "nominal_capacity": 400},
            {"id": "plt-002-R", "station_id": "stn-002", "name": "Platform 2", "direction": "Red Line – Eastbound", "nominal_capacity": 350},
        ],
        "stn-003": [
            {"id": "plt-003-Y", "station_id": "stn-003", "name": "Platform 1", "direction": "Yellow Line – Southbound", "nominal_capacity": 350},
            {"id": "plt-003-V", "station_id": "stn-003", "name": "Platform 2", "direction": "Violet Line – Southbound", "nominal_capacity": 300},
        ],
        "stn-004": [
            {"id": "plt-004-Y", "station_id": "stn-004", "name": "Platform 1", "direction": "Yellow Line", "nominal_capacity": 400},
            {"id": "plt-004-A", "station_id": "stn-004", "name": "Platform 2", "direction": "Airport Express", "nominal_capacity": 250},
        ],
        "stn-005": [
            {"id": "plt-005-B", "station_id": "stn-005", "name": "Platform 1", "direction": "Blue Line", "nominal_capacity": 380},
            {"id": "plt-005-M", "station_id": "stn-005", "name": "Platform 2", "direction": "Magenta Line", "nominal_capacity": 350},
        ],
    }

    platform_count = 0
    for s in stations:
        sid = s["id"]
        plats = KNOWN_PLATFORMS.get(sid, [
            {"id": f"{sid}-P1", "station_id": sid, "name": "Platform 1", "direction": "Northbound / Outbound", "nominal_capacity": 300},
            {"id": f"{sid}-P2", "station_id": sid, "name": "Platform 2", "direction": "Southbound / Inbound", "nominal_capacity": 300},
        ])
        for p in plats:
            client.table("platforms").upsert(p).execute()
            platform_count += 1
    print(f"    -> Synchronized {len(stations)} stations and {platform_count} platforms.")

    print("[2/5] Importing Routes...")
    routes, _ = parse_routes_csv(static_dir / "delhi_metro_routes.csv", valid_station_ids)
    for r in routes:
        client.table("routes").upsert(r).execute()
    print(f"    -> Synchronized {len(routes)} routes.")

    print("[3/5] Seeding Initial Crowd Observations...")
    sample_observations = [
        {
            "id": "obs-001-init",
            "station_id": "stn-001",
            "platform_id": "plt-001-Y",
            "observed_at": now.isoformat(),
            "person_count": 240,
            "crowd_level": "moderate",
            "source": "ml_pipeline",
            "source_name": "CCTV-RJC-01",
            "trend": "rising",
            "processing_status": "processed",
            "is_demo": False,
        },
        {
            "id": "obs-002-init",
            "station_id": "stn-001",
            "platform_id": "plt-001-B",
            "observed_at": now.isoformat(),
            "person_count": 180,
            "crowd_level": "moderate",
            "source": "ml_pipeline",
            "source_name": "CCTV-RJC-02",
            "trend": "stable",
            "processing_status": "processed",
            "is_demo": False,
        },
        {
            "id": "obs-003-init",
            "station_id": "stn-002",
            "platform_id": "plt-002-Y",
            "observed_at": now.isoformat(),
            "person_count": 310,
            "crowd_level": "high",
            "source": "ml_pipeline",
            "source_name": "CCTV-KSG-01",
            "trend": "rising",
            "processing_status": "processed",
            "is_demo": False,
        },
    ]
    for obs in sample_observations:
        client.table("crowd_observations").upsert(obs).execute()
    print(f"    -> Seeded {len(sample_observations)} initial observations.")

    print("[4/5] Seeding Predictions...")
    sample_predictions = [
        {
            "id": "pred-001-5m",
            "station_id": "stn-001",
            "platform_id": "plt-001-Y",
            "generated_at": now.isoformat(),
            "forecast_at": (now + timedelta(minutes=5)).isoformat(),
            "horizon_minutes": 5,
            "predicted_count": 265,
            "predicted_level": "moderate",
            "confidence_score": 0.88,
            "status": "available",
            "model_version": "v1.0-rf-delhi",
            "is_demo": False,
        },
        {
            "id": "pred-001-10m",
            "station_id": "stn-001",
            "platform_id": "plt-001-Y",
            "generated_at": now.isoformat(),
            "forecast_at": (now + timedelta(minutes=10)).isoformat(),
            "horizon_minutes": 10,
            "predicted_count": 310,
            "predicted_level": "high",
            "confidence_score": 0.82,
            "status": "available",
            "model_version": "v1.0-rf-delhi",
            "is_demo": False,
        },
        {
            "id": "pred-001-15m",
            "station_id": "stn-001",
            "platform_id": "plt-001-Y",
            "generated_at": now.isoformat(),
            "forecast_at": (now + timedelta(minutes=15)).isoformat(),
            "horizon_minutes": 15,
            "predicted_count": 345,
            "predicted_level": "high",
            "confidence_score": 0.76,
            "status": "available",
            "model_version": "v1.0-rf-delhi",
            "is_demo": False,
        },
    ]
    for p in sample_predictions:
        client.table("predictions").upsert(p).execute()
    print(f"    -> Seeded {len(sample_predictions)} multi-horizon forecasts.")

    print("[5/5] Seeding Active Alerts & Passenger Reports...")
    sample_alerts = [
        {
            "id": "alt-001-seed",
            "station_id": "stn-002",
            "platform_id": "plt-002-Y",
            "station_name": "Kashmere Gate",
            "platform_name": "Platform 1",
            "type": "crowd_high",
            "message": "High crowd surge detected at Kashmere Gate Platform 1 (Yellow Line). Security marshals notified.",
            "status": "active",
            "is_demo": False,
        }
    ]
    for alt in sample_alerts:
        client.table("alerts").upsert(alt).execute()

    sample_reports = [
        {
            "id": "rep-001-seed",
            "station_id": "stn-001",
            "platform_id": "plt-001-Y",
            "station_name": "Rajiv Chowk",
            "platform_name": "Platform 1",
            "report_type": "high_crowd",
            "status": "new",
            "source": "passenger",
            "is_demo": False,
        }
    ]
    for rep in sample_reports:
        client.table("passenger_reports").upsert(rep).execute()

    print(f"    -> Seeded {len(sample_alerts)} alert and {len(sample_reports)} passenger report.")
    print("=" * 65)
    print("SUCCESS: MetroPulse AI Supabase database is completely seeded!")
    print("=" * 65)
    return True


if __name__ == "__main__":
    seed_database()
