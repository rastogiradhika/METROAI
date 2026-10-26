"""Pydantic schemas for Crowd Observations, Trends, and Video Counting."""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel


CrowdLevelType = Literal["low", "moderate", "high", "critical", "unavailable"]
DataSourceType = Literal["demo", "ml_pipeline", "passenger_report"]
ProcessingStatusType = Literal["processed", "processing", "failed", "pending"]
TrendDirectionType = Literal["rising", "stable", "falling", "insufficient_data"]


class CrowdObservationSchema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    station_id: str
    platform_id: str
    observed_at: str
    person_count: Optional[int] = None
    crowd_level: CrowdLevelType
    source: DataSourceType = "ml_pipeline"
    source_name: Optional[str] = "CCTV Edge Detection"
    trend: Optional[TrendDirectionType] = "stable"
    processing_status: ProcessingStatusType = "processed"
    data_freshness: Optional[str] = "current"
    is_demo: bool = False


class CrowdTrendPointSchema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    time: str  # HH:mm
    observed_count: Optional[int] = None
    crowd_level: CrowdLevelType


class CrowdStatusResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    observation: Optional[CrowdObservationSchema] = None
    status: str = "available"  # available | unavailable | stale
    message: Optional[str] = None


class CrowdHistoryResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    station_id: str
    platform_id: str
    trend_points: List[CrowdTrendPointSchema] = []
    observations: List[CrowdObservationSchema] = []


class CountRequestSchema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    station_id: str
    platform_id: str
    person_count: int = Field(..., ge=0)
    source: Optional[str] = "edge_camera"


class CountResponseSchema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    status: str
    observation: CrowdObservationSchema
