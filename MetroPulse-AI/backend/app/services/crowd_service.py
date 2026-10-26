"""Crowd Service for MetroPulse AI Backend.

Adheres to Section 11:
- Current crowd status lookup by station and platform.
- Observation history and trend calculation.
- Crowd classification based on prototype capacity thresholds.
- Freshness tracking (current, stale, expired).
- Rejects malformed observations and never converts missing data into zero/low.
"""

from typing import List, Optional, Dict, Any
from datetime import timedelta
from fastapi import HTTPException, status
from app.core.config import settings
from app.core.logging import logger
from app.utils.timestamps import now_utc, now_iso, parse_iso, calculate_freshness, format_hh_mm
from app.schemas.crowd import (
    CrowdObservationSchema,
    CrowdTrendPointSchema,
    CrowdStatusResponse,
    CrowdHistoryResponse,
    CrowdLevelType
)
from app.integrations.supabase_client import supabase_manager
from app.integrations.ml_client import ml_client
from app.services.station_service import station_service


# Seed observations matching frontend DEMO_OBSERVATIONS
SEED_OBSERVATIONS = [
    {
        "id": "obs-001",
        "stationId": "stn-001",
        "platformId": "plt-001-Y",
        "observedAt": now_iso(),
        "personCount": 142,
        "crowdLevel": "moderate",
        "source": "ml_pipeline",
        "sourceName": "CCTV Camera #04",
        "trend": "rising",
        "processingStatus": "processed",
        "isDemo": True,
    },
    {
        "id": "obs-002",
        "stationId": "stn-001",
        "platformId": "plt-001-B",
        "observedAt": now_iso(),
        "personCount": 218,
        "crowdLevel": "high",
        "source": "ml_pipeline",
        "sourceName": "CCTV Camera #07",
        "trend": "rising",
        "processingStatus": "processed",
        "isDemo": True,
    },
    {
        "id": "obs-003",
        "stationId": "stn-002",
        "platformId": "plt-002-Y",
        "observedAt": now_iso(),
        "personCount": 78,
        "crowdLevel": "low",
        "source": "ml_pipeline",
        "sourceName": "CCTV Camera #01",
        "trend": "stable",
        "processingStatus": "processed",
        "isDemo": True,
    },
    {
        "id": "obs-004",
        "stationId": "stn-002",
        "platformId": "plt-002-R",
        "observedAt": now_iso(),
        "personCount": 165,
        "crowdLevel": "moderate",
        "source": "ml_pipeline",
        "sourceName": "CCTV Camera #02",
        "trend": "falling",
        "processingStatus": "processed",
        "isDemo": True,
    },
    {
        "id": "obs-005",
        "stationId": "stn-003",
        "platformId": "plt-003-Y",
        "observedAt": now_iso(),
        "personCount": 265,
        "crowdLevel": "critical",
        "source": "ml_pipeline",
        "sourceName": "CCTV Camera #11",
        "trend": "rising",
        "processingStatus": "processed",
        "isDemo": True,
    },
    {
        "id": "obs-006",
        "stationId": "stn-003",
        "platformId": "plt-003-V",
        "observedAt": now_iso(),
        "personCount": 95,
        "crowdLevel": "low",
        "source": "ml_pipeline",
        "sourceName": "CCTV Camera #12",
        "trend": "stable",
        "processingStatus": "processed",
        "isDemo": True,
    },
    {
        "id": "obs-007",
        "stationId": "stn-004",
        "platformId": "plt-004-Y",
        "observedAt": now_iso(),
        "personCount": 130,
        "crowdLevel": "moderate",
        "source": "ml_pipeline",
        "sourceName": "CCTV Camera #15",
        "trend": "stable",
        "processingStatus": "processed",
        "isDemo": True,
    },
    {
        "id": "obs-008",
        "stationId": "stn-005",
        "platformId": "plt-005-B",
        "observedAt": now_iso(),
        "personCount": 54,
        "crowdLevel": "low",
        "source": "ml_pipeline",
        "sourceName": "CCTV Camera #18",
        "trend": "falling",
        "processingStatus": "processed",
        "isDemo": True,
    },
    {
        "id": "obs-009",
        "stationId": "stn-006",
        "platformId": "plt-006-Y",
        "observedAt": now_iso(),
        "personCount": 188,
        "crowdLevel": "high",
        "source": "ml_pipeline",
        "sourceName": "CCTV Camera #20",
        "trend": "rising",
        "processingStatus": "processed",
        "isDemo": True,
    },
]


class CrowdService:
    def __init__(self):
        # In-memory observations keyed by f"{station_id}-{platform_id}"
        self._latest_observations: Dict[str, CrowdObservationSchema] = {}
        self._history: Dict[str, List[CrowdObservationSchema]] = {}
        self._seed_initial_data()

    def _seed_initial_data(self):
        now = now_utc()
        for item in SEED_OBSERVATIONS:
            obs = CrowdObservationSchema(**item)
            key = f"{obs.station_id}-{obs.platform_id}"
            self._latest_observations[key] = obs

            # Generate realistic past 1 hour history points (every 10 minutes)
            points = []
            base_count = obs.person_count or 100
            for i in range(6, -1, -1):
                pt_time = now - timedelta(minutes=i * 10)
                # gentle variation
                variance = int((i - 3) * 6)
                c = max(10, base_count - variance)
                lvl = ml_client.classify_crowd_level(c)
                points.append(CrowdObservationSchema(
                    id=f"hist-{obs.id}-{i}",
                    stationId=obs.station_id,
                    platformId=obs.platform_id,
                    observedAt=pt_time.isoformat(),
                    personCount=c,
                    crowdLevel=lvl,
                    source=obs.source,
                    sourceName=obs.source_name,
                    trend=obs.trend,
                    processingStatus="processed",
                    isDemo=True
                ))
            self._history[key] = points

    async def get_current_observation(self, station_id: str, platform_id: str) -> CrowdStatusResponse:
        """Fetch current crowd status for a platform with explicit freshness validation."""
        key = f"{station_id}-{platform_id}"

        # 1. Check Supabase first if configured
        if supabase_manager.is_configured:
            remote = await supabase_manager.fetch_latest_observation(station_id, platform_id)
            if remote:
                obs_dt = parse_iso(remote.get("observed_at", ""))
                freshness = calculate_freshness(obs_dt) if obs_dt else "expired"
                if freshness != "expired":
                    obs = CrowdObservationSchema(
                        id=remote["id"],
                        stationId=remote["station_id"],
                        platformId=remote["platform_id"],
                        observedAt=remote["observed_at"],
                        personCount=remote.get("person_count"),
                        crowdLevel=remote.get("crowd_level", "unavailable"),
                        source=remote.get("source", "ml_pipeline"),
                        sourceName=remote.get("source_name"),
                        trend=remote.get("trend", "stable"),
                        processingStatus=remote.get("processing_status", "processed"),
                        dataFreshness=freshness,
                        isDemo=remote.get("is_demo", False)
                    )
                    return CrowdStatusResponse(observation=obs, status="available")

        # 2. Check local store
        obs = self._latest_observations.get(key)
        if not obs:
            return CrowdStatusResponse(
                observation=None,
                status="unavailable",
                message=f"No observations available for station '{station_id}' platform '{platform_id}'."
            )

        obs_dt = parse_iso(obs.observed_at)
        freshness = calculate_freshness(obs_dt) if obs_dt else "expired"

        if freshness == "expired":
            return CrowdStatusResponse(
                observation=None,
                status="unavailable",
                message="Data has expired and is no longer usable for real-time guidance."
            )

        # Clone and update freshness
        updated_obs = obs.model_copy(update={"data_freshness": freshness})
        return CrowdStatusResponse(
            observation=updated_obs,
            status="available" if freshness == "current" else "stale"
        )

    async def get_crowd_history(self, station_id: str, platform_id: str) -> CrowdHistoryResponse:
        """Fetch observation history and formatted trend points for charting."""
        key = f"{station_id}-{platform_id}"
        obs_list = self._history.get(key, [])

        trend_points: List[CrowdTrendPointSchema] = []
        for o in obs_list:
            dt = parse_iso(o.observed_at)
            time_str = format_hh_mm(dt) if dt else "--:--"
            trend_points.append(CrowdTrendPointSchema(
                time=time_str,
                observedCount=o.person_count,
                crowdLevel=o.crowd_level
            ))

        return CrowdHistoryResponse(
            stationId=station_id,
            platformId=platform_id,
            trendPoints=trend_points,
            observations=obs_list
        )

    async def record_observation(
        self,
        station_id: str,
        platform_id: str,
        person_count: Optional[int],
        source: str = "ml_pipeline",
        source_name: Optional[str] = None
    ) -> CrowdObservationSchema:
        """Record and validate a newly processed crowd observation."""
        import uuid

        crowd_level = ml_client.classify_crowd_level(person_count)
        now_str = now_iso()

        # Compute trend direction against previous count
        key = f"{station_id}-{platform_id}"
        prev_obs = self._latest_observations.get(key)
        trend = "stable"
        if prev_obs and prev_obs.person_count is not None and person_count is not None:
            diff = person_count - prev_obs.person_count
            if diff > 15:
                trend = "rising"
            elif diff < -15:
                trend = "falling"

        obs = CrowdObservationSchema(
            id=f"obs-{uuid.uuid4().hex[:8]}",
            stationId=station_id,
            platformId=platform_id,
            observedAt=now_str,
            personCount=person_count,
            crowdLevel=crowd_level,
            source=source,
            sourceName=source_name or "Edge Vision Pipeline",
            trend=trend,
            processingStatus="processed",
            dataFreshness="current",
            isDemo=False
        )

        self._latest_observations[key] = obs
        if key not in self._history:
            self._history[key] = []
        self._history[key].append(obs)
        # Keep last 30 observations
        if len(self._history[key]) > 30:
            self._history[key].pop(0)

        # Persist to Supabase if configured
        if supabase_manager.is_configured:
            await supabase_manager.insert_crowd_observation({
                "id": obs.id,
                "station_id": obs.station_id,
                "platform_id": obs.platform_id,
                "observed_at": obs.observed_at,
                "person_count": obs.person_count,
                "crowd_level": obs.crowd_level,
                "source": obs.source,
                "source_name": obs.source_name,
                "trend": obs.trend,
                "processing_status": obs.processing_status,
                "is_demo": False
            })

        return obs

    async def get_all_current_observations(self) -> List[CrowdObservationSchema]:
        """Return list of latest observations for all monitored platforms."""
        return list(self._latest_observations.values())


crowd_service = CrowdService()
