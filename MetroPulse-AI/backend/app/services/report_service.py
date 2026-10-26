"""Passenger Report Service for MetroPulse AI Backend.

Adheres to Section 15:
- Ingestion of crowd observations reported by passengers.
- Rate limiting and rapid duplicate prevention.
- Tracking report status (new, reviewed, flagged, expired).
- Never confuses passenger qualitative input with an exact camera head-count.
"""

from typing import List, Optional, Dict
from datetime import datetime
import uuid
from fastapi import HTTPException, status
from app.core.config import settings
from app.core.logging import logger
from app.utils.timestamps import now_utc, now_iso, parse_iso, is_report_active
from app.schemas.report import PassengerReportCreateSchema, PassengerReportSchema, ReportListResponse
from app.integrations.supabase_client import supabase_manager
from app.services.station_service import station_service


SEED_REPORTS = [
    {
        "id": "rpt-001",
        "stationId": "stn-001",
        "platformId": "plt-001-Y",
        "stationName": "Rajiv Chowk",
        "platformName": "Platform 1",
        "reportType": "high_crowd",
        "reportedAt": now_iso(),
        "status": "new",
        "source": "passenger",
        "isDemo": True,
    },
    {
        "id": "rpt-002",
        "stationId": "stn-001",
        "platformId": "plt-001-B",
        "stationName": "Rajiv Chowk",
        "platformName": "Platform 2",
        "reportType": "overcrowding",
        "reportedAt": now_iso(),
        "status": "reviewed",
        "source": "passenger",
        "isDemo": True,
    },
    {
        "id": "rpt-003",
        "stationId": "stn-003",
        "platformId": "plt-003-Y",
        "stationName": "Central Secretariat",
        "platformName": "Platform 1",
        "reportType": "overcrowding",
        "reportedAt": now_iso(),
        "status": "new",
        "source": "passenger",
        "isDemo": True,
    },
]


class ReportService:
    def __init__(self):
        self._reports: List[PassengerReportSchema] = [
            PassengerReportSchema(**r) for r in SEED_REPORTS
        ]
        # Dict tracking last submission timestamp per (station_id, platform_id)
        self._last_submissions: Dict[str, datetime] = {}

    async def submit_report(self, data: PassengerReportCreateSchema) -> PassengerReportSchema:
        """Submit a new passenger crowd report with rate limiting."""
        # 1. Validate station existence
        stn = await station_service.get_station_by_id(data.station_id)
        if not stn:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Station with ID '{data.station_id}' does not exist."
            )

        platform_match = next((p for p in stn.platforms if p.id == data.platform_id), None)
        if not platform_match:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Platform with ID '{data.platform_id}' not found at station '{stn.name}'."
            )

        # 2. Rate limit / duplicate check
        key = f"{data.station_id}-{data.platform_id}"
        now = now_utc()
        last_time = self._last_submissions.get(key)
        if last_time:
            diff_sec = (now - last_time).total_seconds()
            if diff_sec < settings.REPORT_RATE_LIMIT_SECONDS:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"A report for this platform was submitted recently. Please wait {int(settings.REPORT_RATE_LIMIT_SECONDS - diff_sec)} seconds before submitting another report."
                )

        self._last_submissions[key] = now

        station_name = data.station_name or stn.name
        platform_name = data.platform_name or platform_match.name

        report = PassengerReportSchema(
            id=f"rpt-{uuid.uuid4().hex[:8]}",
            stationId=data.station_id,
            platformId=data.platform_id,
            stationName=station_name,
            platformName=platform_name,
            reportType=data.report_type,
            reportedAt=now.isoformat(),
            status="new",
            source="passenger",
            isDemo=False
        )

        self._reports.insert(0, report)

        # Persist to Supabase if configured
        if supabase_manager.is_configured:
            await supabase_manager.insert_passenger_report({
                "id": report.id,
                "station_id": report.station_id,
                "platform_id": report.platform_id,
                "station_name": report.station_name,
                "platform_name": report.platform_name,
                "report_type": report.report_type,
                "reported_at": report.reported_at,
                "status": report.status,
                "source": "passenger",
                "is_demo": False
            })

        return report

    async def get_all_reports(self, limit: int = 50) -> ReportListResponse:
        """Retrieve all active/recent passenger reports."""
        if supabase_manager.is_configured:
            remote = await supabase_manager.fetch_passenger_reports()
            if remote:
                parsed = [
                    PassengerReportSchema(
                        id=r["id"],
                        stationId=r["station_id"],
                        platformId=r["platform_id"],
                        stationName=r.get("station_name", "Station"),
                        platformName=r.get("platform_name", "Platform"),
                        reportType=r["report_type"],
                        reportedAt=r["reported_at"],
                        status=r.get("status", "new"),
                        source="passenger",
                        isDemo=r.get("is_demo", False)
                    )
                    for r in remote
                ]
                return ReportListResponse(reports=parsed[:limit], total=len(parsed))

        # Check and update expiry
        active_reports = []
        for r in self._reports:
            dt = parse_iso(r.reported_at)
            if dt and not is_report_active(dt):
                r_updated = r.model_copy(update={"status": "expired"})
                active_reports.append(r_updated)
            else:
                active_reports.append(r)

        return ReportListResponse(reports=active_reports[:limit], total=len(active_reports))


report_service = ReportService()
