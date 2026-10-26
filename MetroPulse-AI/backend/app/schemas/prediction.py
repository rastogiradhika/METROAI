"""Pydantic schemas for Crowd Predictions."""

from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from app.schemas.crowd import CrowdLevelType


PredictionHorizonType = Literal[5, 10, 15]
PredictionStatusType = Literal["available", "insufficient_data", "unavailable", "failed"]


class CrowdPredictionSchema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    station_id: str
    platform_id: str
    generated_at: str
    forecast_at: str
    horizon_minutes: PredictionHorizonType
    predicted_count: Optional[int] = None
    predicted_level: CrowdLevelType
    confidence_score: Optional[float] = None
    status: PredictionStatusType = "available"
    model_version: Optional[str] = "v1.0-rf-baseline"
    is_demo: bool = False


class PredictionResponseSchema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    station_id: str
    platform_id: str
    predictions: List[CrowdPredictionSchema] = []
    overall_status: PredictionStatusType = "available"
    disclaimer: str = "Predictions are AI forecasts based on recent trend patterns and historical platform profiles."
