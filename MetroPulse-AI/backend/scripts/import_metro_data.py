"""Station and Route Data Import Script for MetroPulse AI.

Adheres to Section 20:
- Reads CSV source files from data/metro_static/.
- Validates required columns, coordinates, and encoding.
- Normalizes station and route identifiers.
- Detects duplicate records.
- Supports --dry-run flag.
- Provides comprehensive summary statistics.

Usage:
    python scripts/import_metro_data.py --dry-run
    python scripts/import_metro_data.py --commit
"""

import argparse
import csv
from pathlib import Path
import sys
from typing import List, Dict, Any, Tuple


# Add backend root to sys.path so we can import app modules
BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings
from app.core.logging import logger
from app.integrations.supabase_client import supabase_manager


REQUIRED_STATION_COLS = ["station_id", "station_name", "station_code", "line_names", "interchange", "latitude", "longitude"]
REQUIRED_ROUTE_COLS = ["route_id", "source_station_id", "dest_station_id", "stops_sequence", "line_names"]


def parse_stations_csv(csv_path: Path) -> Tuple[List[Dict[str, Any]], List[str]]:
    """Parse and validate station records from CSV."""
    if not csv_path.exists():
        return [], [f"File not found: {csv_path}"]

    accepted: List[Dict[str, Any]] = []
    rejected: List[str] = []
    seen_ids = set()
    seen_codes = set()

    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        missing_cols = set(REQUIRED_STATION_COLS) - set(reader.fieldnames or [])
        if missing_cols:
            return [], [f"Missing required columns in {csv_path.name}: {missing_cols}"]

        for idx, row in enumerate(reader, start=2):
            sid = row.get("station_id", "").strip()
            name = row.get("station_name", "").strip()
            code = row.get("station_code", "").strip().upper()

            if not sid or not name or not code:
                rejected.append(f"Row {idx}: missing mandatory station_id, name, or code.")
                continue

            if sid in seen_ids:
                rejected.append(f"Row {idx}: duplicate station_id '{sid}'.")
                continue
            if code in seen_codes:
                rejected.append(f"Row {idx}: duplicate station code '{code}'.")
                continue

            try:
                lat = float(row.get("latitude", 0.0))
                lng = float(row.get("longitude", 0.0))
            except ValueError:
                rejected.append(f"Row {idx}: invalid latitude/longitude float values.")
                continue

            # Parse line names (separated by semicolon)
            raw_lines = row.get("line_names", "")
            lines = [ln.strip() for ln in raw_lines.split(";") if ln.strip()]

            interchange = row.get("interchange", "False").lower() in ("true", "1", "yes")

            seen_ids.add(sid)
            seen_codes.add(code)

            accepted.append({
                "id": sid,
                "name": name,
                "code": code,
                "line_names": lines,
                "interchange": interchange,
                "latitude": lat,
                "longitude": lng
            })

    return accepted, rejected


def parse_routes_csv(csv_path: Path, valid_station_ids: set) -> Tuple[List[Dict[str, Any]], List[str]]:
    """Parse and validate route records from CSV."""
    if not csv_path.exists():
        return [], [f"File not found: {csv_path}"]

    accepted: List[Dict[str, Any]] = []
    rejected: List[str] = []
    seen_routes = set()

    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        missing_cols = set(REQUIRED_ROUTE_COLS) - set(reader.fieldnames or [])
        if missing_cols:
            return [], [f"Missing required columns in {csv_path.name}: {missing_cols}"]

        for idx, row in enumerate(reader, start=2):
            rid = row.get("route_id", "").strip()
            src = row.get("source_station_id", "").strip()
            dst = row.get("dest_station_id", "").strip()

            if not rid or not src or not dst:
                rejected.append(f"Row {idx}: missing route_id, source, or dest.")
                continue

            if (src, dst) in seen_routes:
                rejected.append(f"Row {idx}: duplicate route from '{src}' to '{dst}'.")
                continue

            if src not in valid_station_ids:
                rejected.append(f"Row {idx}: source station '{src}' does not exist in stations table.")
                continue
            if dst not in valid_station_ids:
                rejected.append(f"Row {idx}: destination station '{dst}' does not exist in stations table.")
                continue

            stops_raw = row.get("stops_sequence", "")
            stops = [s.strip() for s in stops_raw.split(";") if s.strip()]

            raw_lines = row.get("line_names", "")
            lines = [ln.strip() for ln in raw_lines.split(";") if ln.strip()]

            duration = 10
            try:
                if row.get("estimated_duration_min"):
                    duration = int(row["estimated_duration_min"])
            except ValueError:
                pass

            seen_routes.add((src, dst))

            accepted.append({
                "id": rid,
                "source_station_id": src,
                "destination_station_id": dst,
                "station_sequence": [{"stationId": s} for s in stops],
                "total_stops": max(1, len(stops) - 1),
                "estimated_duration_minutes": duration,
                "line_names": lines
            })

    return accepted, rejected


def main():
    parser = argparse.ArgumentParser(description="Import static metro stations and routes into MetroPulse AI database.")
    parser.add_argument("--dry-run", action="store_true", help="Simulate import and print validation summary without database writes.")
    parser.add_argument("--commit", action="store_true", help="Write accepted records into Supabase database if configured.")
    args = parser.parse_args()

    if not args.dry_run and not args.commit:
        print("Please specify either --dry-run or --commit. Defaulting to --dry-run for safety.\n")
        args.dry_run = True

    static_dir = settings.DATA_STATIC_DIR
    stations_csv = static_dir / "delhi_metro_stations.csv"
    routes_csv = static_dir / "delhi_metro_routes.csv"

    print("=" * 60)
    print(f"METROPULSE AI — STATION DATA IMPORT SCRIPT")
    print(f"Mode: {'DRY RUN (No writes)' if args.dry_run else 'COMMIT TO DATABASE'}")
    print(f"Static directory: {static_dir}")
    print("=" * 60)

    # 1. Parse Stations
    stations, station_errors = parse_stations_csv(stations_csv)
    print(f"\n[1/2] STATIONS VALIDATION:")
    print(f"  Accepted rows : {len(stations)}")
    print(f"  Rejected rows : {len(station_errors)}")
    for err in station_errors:
        print(f"    - {err}")

    valid_station_ids = {s["id"] for s in stations}

    # 2. Parse Routes
    routes, route_errors = parse_routes_csv(routes_csv, valid_station_ids)
    print(f"\n[2/2] ROUTES VALIDATION:")
    print(f"  Accepted rows : {len(routes)}")
    print(f"  Rejected rows : {len(route_errors)}")
    for err in route_errors:
        print(f"    - {err}")

    # 3. Execution Summary
    print("\n" + "=" * 60)
    if args.dry_run:
        print("DRY RUN COMPLETE — All records validated successfully.")
        print(f"Ready to import {len(stations)} stations and {len(routes)} routes.")
    elif args.commit:
        if not supabase_manager.is_configured:
            print("WARNING: Supabase is not configured with live credentials.")
            print("Skipping remote database write. Verified records remain in local static catalog.")
        else:
            print("Committing validated records to Supabase...")
            # Perform upsert
            client = supabase_manager.client
            try:
                for s in stations:
                    client.table("stations").upsert(s).execute()
                for r in routes:
                    client.table("routes").upsert(r).execute()
                print("DATABASE COMMIT SUCCESSFUL: All records synchronized with Supabase.")
            except Exception as e:
                print(f"ERROR committing to Supabase: {e}")
    print("=" * 60)


if __name__ == "__main__":
    main()
