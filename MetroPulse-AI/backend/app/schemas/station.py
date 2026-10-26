"""Pydantic schemas for Stations and Routes."""

from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class Coordinates(BaseModel):
    lat: float
    lng: float


class PlatformSchema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    name: str
    direction: Optional[str] = None


class StationSchema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    name: str
    code: str
    line_names: List[str]
    platforms: List[PlatformSchema] = []
    coordinates: Optional[Coordinates] = None
    interchange: Optional[bool] = False


class RouteStopSchema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    station_id: str
    station_name: str
    station_code: str
    line_name: str
    is_interchange: bool = False
    platform_id: Optional[str] = None


class InterchangeInfoSchema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    station_id: str
    station_name: str
    from_line: str
    to_line: str


class RouteSchema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    source_station_id: str
    destination_station_id: str
    station_sequence: List[RouteStopSchema]
    total_stops: int
    estimated_duration_minutes: Optional[int] = None
    interchanges: List[InterchangeInfoSchema] = []
    line_names: List[str] = []


class StationListResponse(BaseModel):
    stations: List[StationSchema]
    total: int
