"""Station API routes for MetroPulse AI."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.station import StationSchema, StationListResponse
from app.services.station_service import station_service
from app.utils.validation import validate_identifier


router = APIRouter(prefix="/stations", tags=["Stations"])


@router.get("", response_model=List[StationSchema])
async def list_stations(
    search: Optional[str] = Query(None, description="Filter stations by name or code")
):
    """Retrieve list of monitored Delhi Metro stations."""
    stations = await station_service.get_all_stations(search=search)
    return stations


@router.get("/{station_id}", response_model=StationSchema)
async def get_station(station_id: str):
    """Retrieve detailed platform and line metadata for a specific station."""
    clean_id = validate_identifier(station_id, "station_id")
    station = await station_service.get_station_by_id(clean_id)
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Station with ID '{station_id}' was not found."
        )
    return station
