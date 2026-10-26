"""Prediction API routes for MetroPulse AI."""

from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.prediction import PredictionResponseSchema, CrowdPredictionSchema
from app.services.prediction_service import prediction_service
from app.utils.validation import validate_identifier


router = APIRouter(prefix="/predictions", tags=["Predictions"])


@router.get("/{station_id}/{platform_id}", response_model=PredictionResponseSchema)
async def get_platform_predictions(
    station_id: str,
    platform_id: str,
    horizon: Optional[int] = Query(None, description="Optional target horizon in minutes (5, 10, or 15)")
):
    """Retrieve short-term crowd predictions for 5, 10, and 15-minute horizons."""
    clean_sid = validate_identifier(station_id, "station_id")
    clean_pid = validate_identifier(platform_id, "platform_id")

    if horizon is not None and horizon not in (5, 10, 15):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Horizon must be one of [5, 10, 15] minutes."
        )

    preds = await prediction_service.get_predictions(clean_sid, clean_pid, horizon=horizon)
    return preds
