"""Pydantic schemas for Passenger Reports."""

from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


ReportType = Literal["high_crowd", "overcrowding", "safety_concern", "other"]
ReportStatusType = Literal["new", "reviewed", "flagged", "expired"]


class PassengerReportCreateSchema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    station_id: str
    platform_id: str
    station_name: Optional[str] = None
    platform_name: Optional[str] = None
    report_type: ReportType


class PassengerReportSchema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    station_id: str
    platform_id: str
    station_name: str
    platform_name: str
    report_type: ReportType
    reported_at: str
    status: ReportStatusType = "new"
    source: str = "passenger"
    is_demo: bool = False


class ReportListResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    reports: List[PassengerReportSchema]
    total: int
