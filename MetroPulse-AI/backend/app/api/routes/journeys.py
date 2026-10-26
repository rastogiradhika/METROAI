"""Journey Planning API routes."""

from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.station import RouteSchema
from app.services.journey_service import journey_service
from app.utils.validation import validate_identifier


router = APIRouter(prefix="/journey", tags=["Journeys"])


@router.get("", response_model=RouteSchema)
async def plan_journey(
    source_id: Optional[str] = Query(None, alias="from", description="Origin station ID"),
    dest_id: Optional[str] = Query(None, alias="to", description="Destination station ID"),
    source: Optional[str] = Query(None, description="Alternative origin station ID parameter"),
    destination: Optional[str] = Query(None, description="Alternative destination station ID parameter"),
    source_station_id: Optional[str] = Query(None, alias="sourceStationId"),
    dest_station_id: Optional[str] = Query(None, alias="destinationStationId"),
):
    """Plan metro route sequence between two stations."""
    src = source_id or source or source_station_id
    dst = dest_id or destination or dest_station_id

    if not src or not dst:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both origin and destination stations must be specified via '?from=...&to=...' or '?source=...&destination=...'."
        )

    clean_src = validate_identifier(src, "source station")
    clean_dst = validate_identifier(dst, "destination station")

    route = await journey_service.plan_journey(clean_src, clean_dst)
    return route
