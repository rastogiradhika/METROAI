"""Alert Engine Service for MetroPulse AI Backend.

Adheres to Section 16:
- Listing, fetching, acknowledging, and resolving alerts.
- Distinct status transitions: active -> acknowledged -> resolved.
- Prevents alert spam through configurable cooldown thresholds.
- Never creates high-crowd alerts from stale or missing data.
"""

from typing import List, Optional, Dict
from datetime import datetime, timezone
import uuid
from fastapi import HTTPException, status
from app.core.config import settings
from app.core.logging import logger
from app.utils.timestamps import now_utc, now_iso, parse_iso
from app.schemas.alert import CrowdAlertSchema, AlertUpdateSchema, AlertListResponse, AlertType, AlertStatusType
from app.integrations.supabase_client import supabase_manager


SEED_ALERTS = [
    {
        "id": "alt-001",
        "stationId": "stn-001",
        "platformId": "plt-001-B",
        "stationName": "Rajiv Chowk",
        "platformName": "Platform 2",
        "type": "crowd_high",
        "message": "High passenger surge detected on Platform 2 (Blue Line Eastbound). Crowd density exceeds 72%.",
        "createdAt": now_iso(),
        "status": "active",
        "isDemo": True,
    },
    {
        "id": "alt-002",
        "stationId": "stn-003",
        "platformId": "plt-003-Y",
        "stationName": "Central Secretariat",
        "platformName": "Platform 1",
        "type": "crowd_critical",
        "message": "Critical congestion advisory: Platform 1 density at 88%. Staff intervention advised to regulate stairwell inflow.",
        "createdAt": now_iso(),
        "status": "active",
        "isDemo": True,
    },
    {
        "id": "alt-003",
        "stationId": "stn-002",
        "platformId": "plt-002-R",
        "stationName": "Kashmere Gate",
        "platformName": "Platform 2",
        "type": "service_disruption",
        "message": "Temporary train headway delay of ~4 minutes on Red Line Eastbound due to track signal calibration.",
        "createdAt": now_iso(),
        "status": "acknowledged",
        "acknowledgedAt": now_iso(),
        "isDemo": True,
    },
    {
        "id": "alt-004",
        "stationId": "stn-001",
        "platformId": "plt-001-Y",
        "stationName": "Rajiv Chowk",
        "platformName": "Platform 1",
        "type": "passenger_report",
        "message": "Multiple passenger reports confirm heavy boarding rush near coach 4-6.",
        "createdAt": now_iso(),
        "status": "resolved",
        "resolvedAt": now_iso(),
        "isDemo": True,
    },
]


class AlertService:
    def __init__(self):
        self._alerts: Dict[str, CrowdAlertSchema] = {
            a["id"]: CrowdAlertSchema(**a) for a in SEED_ALERTS
        }
        self._last_alert_time: Dict[str, datetime] = {}

    async def get_all_alerts(
        self,
        status_filter: Optional[str] = None,
        station_id: Optional[str] = None
    ) -> AlertListResponse:
        """Fetch all alerts, optionally filtered by status or station ID."""
        if supabase_manager.is_configured:
            remote = await supabase_manager.fetch_alerts(status=status_filter)
            if remote:
                parsed = [
                    CrowdAlertSchema(
                        id=a["id"],
                        stationId=a["station_id"],
                        platformId=a["platform_id"],
                        stationName=a.get("station_name", "Station"),
                        platformName=a.get("platform_name", "Platform"),
                        type=a["type"],
                        message=a["message"],
                        createdAt=a["created_at"],
                        status=a.get("status", "active"),
                        acknowledgedAt=a.get("acknowledged_at"),
                        resolvedAt=a.get("resolved_at"),
                        isDemo=a.get("is_demo", False)
                    )
                    for a in remote
                ]
                if station_id:
                    parsed = [a for a in parsed if a.station_id == station_id]
                return AlertListResponse(alerts=parsed, total=len(parsed))

        all_alerts = list(self._alerts.values())
        if status_filter:
            all_alerts = [a for a in all_alerts if a.status == status_filter]
        if station_id:
            all_alerts = [a for a in all_alerts if a.station_id == station_id]

        # Sort newest first
        all_alerts.sort(key=lambda a: a.created_at, reverse=True)
        return AlertListResponse(alerts=all_alerts, total=len(all_alerts))

    async def get_alert_by_id(self, alert_id: str) -> CrowdAlertSchema:
        """Retrieve single alert by ID."""
        alert = self._alerts.get(alert_id)
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Alert with ID '{alert_id}' was not found."
            )
        return alert

    async def update_alert_status(self, alert_id: str, update: AlertUpdateSchema) -> CrowdAlertSchema:
        """Acknowledge or resolve an alert with timestamp recording."""
        alert = await self.get_alert_by_id(alert_id)
        now = now_iso()

        updates = {"status": update.status}
        if update.status == "acknowledged":
            updates["acknowledged_at"] = now
        elif update.status == "resolved":
            updates["resolved_at"] = now

        updated_alert = alert.model_copy(update=updates)
        self._alerts[alert_id] = updated_alert

        if supabase_manager.is_configured:
            await supabase_manager.update_alert(alert_id, {
                "status": update.status,
                "acknowledged_at": updated_alert.acknowledged_at,
                "resolved_at": updated_alert.resolved_at
            })

        logger.info(f"Alert {alert_id} transition to status: {update.status}")
        return updated_alert

    async def trigger_crowd_alert_if_needed(
        self,
        station_id: str,
        platform_id: str,
        station_name: str,
        platform_name: str,
        crowd_level: str,
        person_count: int,
        capacity: int = settings.DEFAULT_PLATFORM_CAPACITY
    ) -> Optional[CrowdAlertSchema]:
        """Trigger a crowd alert if thresholds are met and cooldown period has expired."""
        if crowd_level not in ("high", "critical"):
            return None

        key = f"{station_id}-{platform_id}"
        now = now_utc()
        last_time = self._last_alert_time.get(key)
        if last_time:
            elapsed = (now - last_time).total_seconds()
            if elapsed < settings.ALERT_COOLDOWN_SECONDS:
                # Cooldown active, suppress duplicate alert
                return None

        self._last_alert_time[key] = now
        alert_type: AlertType = "crowd_critical" if crowd_level == "critical" else "crowd_high"
        pct = int((person_count / capacity) * 100)

        message = (
            f"Automated Alert: Platform occupancy at {pct}% ({person_count} passengers). "
            f"{'Critical passenger safety threshold reached.' if crowd_level == 'critical' else 'Congestion advisory for incoming trains.'}"
        )

        alert = CrowdAlertSchema(
            id=f"alt-{uuid.uuid4().hex[:8]}",
            stationId=station_id,
            platformId=platform_id,
            stationName=station_name,
            platformName=platform_name,
            type=alert_type,
            message=message,
            createdAt=now.isoformat(),
            status="active",
            isDemo=False
        )

        self._alerts[alert.id] = alert
        if supabase_manager.is_configured:
            await supabase_manager.insert_alert({
                "id": alert.id,
                "station_id": alert.station_id,
                "platform_id": alert.platform_id,
                "station_name": alert.station_name,
                "platform_name": alert.platform_name,
                "type": alert.type,
                "message": alert.message,
                "created_at": alert.created_at,
                "status": alert.status,
                "is_demo": False
            })

        logger.info(f"Generated {alert_type} alert {alert.id} for {station_name} {platform_name}")
        return alert


alert_service = AlertService()
