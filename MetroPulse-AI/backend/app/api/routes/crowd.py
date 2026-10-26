"""Crowd Observation and Occupancy API routes."""

from typing import List
from fastapi import APIRouter, HTTPException, status
from app.schemas.crowd import (
    CrowdObservationSchema,
    CrowdStatusResponse,
    CrowdHistoryResponse,
    CountRequestSchema,
    CountResponseSchema
)
from app.services.crowd_service import crowd_service
from app.utils.validation import validate_identifier


router = APIRouter(tags=["Crowd Observations"])


@router.get("/crowd", response_model=List[CrowdObservationSchema])
async def get_all_crowd_observations():
    """Retrieve all current observations across monitored metro stations."""
    observations = await crowd_service.get_all_current_observations()
    return observations


@router.get("/crowd/{station_id}/{platform_id}/current", response_model=CrowdStatusResponse)
async def get_current_crowd(station_id: str, platform_id: str):
    """Retrieve the latest validated crowd observation and freshness state for a platform."""
    clean_sid = validate_identifier(station_id, "station_id")
    clean_pid = validate_identifier(platform_id, "platform_id")
    resp = await crowd_service.get_current_observation(clean_sid, clean_pid)
    return resp


@router.get("/crowd/{station_id}/{platform_id}/history", response_model=CrowdHistoryResponse)
async def get_crowd_history(station_id: str, platform_id: str):
    """Retrieve observation history and trend points for charting."""
    clean_sid = validate_identifier(station_id, "station_id")
    clean_pid = validate_identifier(platform_id, "platform_id")
    history = await crowd_service.get_crowd_history(clean_sid, clean_pid)
    return history


@router.post("/count", response_model=CountResponseSchema)
async def submit_people_count(payload: CountRequestSchema):
    """Record an edge-detected person count for a station platform."""
    clean_sid = validate_identifier(payload.station_id, "station_id")
    clean_pid = validate_identifier(payload.platform_id, "platform_id")

    obs = await crowd_service.record_observation(
        station_id=clean_sid,
        platform_id=clean_pid,
        person_count=payload.person_count,
        source="ml_pipeline",
        source_name=payload.source or "Edge Head Counter"
    )

    return CountResponseSchema(
        status="success",
        observation=obs
    )
