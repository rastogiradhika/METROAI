"""Pydantic schemas for System and Crowd Alerts."""

from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


AlertType = Literal["crowd_high", "crowd_critical", "system_data", "service_disruption", "passenger_report"]
AlertStatusType = Literal["active", "acknowledged", "resolved"]


class CrowdAlertSchema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    station_id: str
    platform_id: str
    station_name: str
    platform_name: str
    type: AlertType
    message: str
    created_at: str
    status: AlertStatusType = "active"
    acknowledged_at: Optional[str] = None
    resolved_at: Optional[str] = None
    is_demo: bool = False


class AlertUpdateSchema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    status: AlertStatusType
    action_note: Optional[str] = None


class AlertListResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    alerts: List[CrowdAlertSchema]
    total: int
