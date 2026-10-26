"""Alert Management API routes."""

from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.alert import CrowdAlertSchema, AlertUpdateSchema, AlertListResponse
from app.services.alert_service import alert_service
from app.utils.validation import validate_identifier


router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=AlertListResponse)
async def list_alerts(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (active, acknowledged, resolved)"),
    station_id: Optional[str] = Query(None, alias="stationId", description="Filter by station ID")
):
    """Retrieve operational and passenger crowd advisories."""
    alerts = await alert_service.get_all_alerts(status_filter=status_filter, station_id=station_id)
    return alerts


@router.get("/{alert_id}", response_model=CrowdAlertSchema)
async def get_alert(alert_id: str):
    """Retrieve a specific alert by ID."""
    clean_id = validate_identifier(alert_id, "alert_id")
    alert = await alert_service.get_alert_by_id(clean_id)
    return alert


@router.patch("/{alert_id}", response_model=CrowdAlertSchema)
async def update_alert(alert_id: str, payload: AlertUpdateSchema):
    """Acknowledge or resolve an operational alert."""
    clean_id = validate_identifier(alert_id, "alert_id")
    updated = await alert_service.update_alert_status(clean_id, payload)
    return updated
