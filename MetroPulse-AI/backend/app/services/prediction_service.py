"""Crowd Prediction Service for MetroPulse AI Backend.

Adheres to Section 14:
- Short-term forecasts for 5, 10, and 15-minute horizons.
- Integrates with trained scikit-learn models (Random Forest / Linear Regression).
- Never reports a prediction as a measured observation.
- Explicitly handles 'insufficient_data' and 'unavailable' states.
- Generates distinct 'generatedAt' and 'forecastAt' timestamps.
"""

from datetime import timedelta
from typing import List, Optional, Dict, Any
import uuid
from app.core.config import settings
from app.core.logging import logger
from app.utils.timestamps import now_utc, now_iso
from app.schemas.prediction import (
    CrowdPredictionSchema,
    PredictionResponseSchema,
    PredictionHorizonType
)
from app.integrations.supabase_client import supabase_manager
from app.integrations.ml_client import ml_client
from app.services.crowd_service import crowd_service
from app.services.station_service import station_service


# Seed initial predictions matching frontend DEMO_PREDICTIONS
SEED_PREDICTIONS = [
    # Rajiv Chowk Y
    {"id": "pred-001-05", "stationId": "stn-001", "platformId": "plt-001-Y", "horizonMinutes": 5, "predictedCount": 158, "predictedLevel": "moderate", "confidenceScore": 0.94, "status": "available", "isDemo": True},
    {"id": "pred-001-10", "stationId": "stn-001", "platformId": "plt-001-Y", "horizonMinutes": 10, "predictedCount": 185, "predictedLevel": "high", "confidenceScore": 0.91, "status": "available", "isDemo": True},
    {"id": "pred-001-15", "stationId": "stn-001", "platformId": "plt-001-Y", "horizonMinutes": 15, "predictedCount": 210, "predictedLevel": "high", "confidenceScore": 0.88, "status": "available", "isDemo": True},

    # Rajiv Chowk B
    {"id": "pred-002-05", "stationId": "stn-001", "platformId": "plt-001-B", "horizonMinutes": 5, "predictedCount": 230, "predictedLevel": "high", "confidenceScore": 0.93, "status": "available", "isDemo": True},
    {"id": "pred-002-10", "stationId": "stn-001", "platformId": "plt-001-B", "horizonMinutes": 10, "predictedCount": 260, "predictedLevel": "critical", "confidenceScore": 0.89, "status": "available", "isDemo": True},
    {"id": "pred-002-15", "stationId": "stn-001", "platformId": "plt-001-B", "horizonMinutes": 15, "predictedCount": 275, "predictedLevel": "critical", "confidenceScore": 0.85, "status": "available", "isDemo": True},

    # Kashmere Gate Y
    {"id": "pred-003-05", "stationId": "stn-002", "platformId": "plt-002-Y", "horizonMinutes": 5, "predictedCount": 82, "predictedLevel": "low", "confidenceScore": 0.96, "status": "available", "isDemo": True},
    {"id": "pred-003-10", "stationId": "stn-002", "platformId": "plt-002-Y", "horizonMinutes": 10, "predictedCount": 90, "predictedLevel": "low", "confidenceScore": 0.93, "status": "available", "isDemo": True},
    {"id": "pred-003-15", "stationId": "stn-002", "platformId": "plt-002-Y", "horizonMinutes": 15, "predictedCount": 105, "predictedLevel": "moderate", "confidenceScore": 0.90, "status": "available", "isDemo": True},

    # Central Secretariat Y
    {"id": "pred-005-05", "stationId": "stn-003", "platformId": "plt-003-Y", "horizonMinutes": 5, "predictedCount": 272, "predictedLevel": "critical", "confidenceScore": 0.92, "status": "available", "isDemo": True},
    {"id": "pred-005-10", "stationId": "stn-003", "platformId": "plt-003-Y", "horizonMinutes": 10, "predictedCount": 280, "predictedLevel": "critical", "confidenceScore": 0.88, "status": "available", "isDemo": True},
    {"id": "pred-005-15", "stationId": "stn-003", "platformId": "plt-003-Y", "horizonMinutes": 15, "predictedCount": 290, "predictedLevel": "critical", "confidenceScore": 0.84, "status": "available", "isDemo": True},
]


class PredictionService:
    def __init__(self):
        self._cache: Dict[str, List[CrowdPredictionSchema]] = {}
        self._seed_initial_predictions()

    def _seed_initial_predictions(self):
        now = now_utc()
        for p in SEED_PREDICTIONS:
            horizon = p["horizonMinutes"]
            forecast_time = now + timedelta(minutes=horizon)
            pred = CrowdPredictionSchema(
                id=p["id"],
                stationId=p["stationId"],
                platformId=p["platformId"],
                generatedAt=now.isoformat(),
                forecastAt=forecast_time.isoformat(),
                horizonMinutes=horizon,
                predictedCount=p["predictedCount"],
                predictedLevel=p["predictedLevel"],
                confidenceScore=p["confidenceScore"],
                status=p["status"],
                modelVersion="v1.0-rf-baseline",
                isDemo=True
            )
            key = f"{pred.station_id}-{pred.platform_id}"
            if key not in self._cache:
                self._cache[key] = []
            self._cache[key].append(pred)

    async def get_predictions(
        self,
        station_id: str,
        platform_id: str,
        horizon: Optional[int] = None
    ) -> PredictionResponseSchema:
        """Generate or retrieve crowd predictions for a station/platform."""
        key = f"{station_id}-{platform_id}"
        now = now_utc()

        # 1. Fetch recent observation history for feature extraction
        history_resp = await crowd_service.get_crowd_history(station_id, platform_id)
        recent_counts = [
            obs.person_count for obs in history_resp.observations
            if obs.person_count is not None
        ]

        stn = await station_service.get_station_by_id(station_id)
        stn_name = stn.name if stn else "Metro Station"

        # 2. Run real ML prediction via ml_client
        ml_preds = ml_client.predict_crowd(
            station_id=station_id,
            platform_id=platform_id,
            recent_counts=recent_counts,
            station_name=stn_name
        )

        results: List[CrowdPredictionSchema] = []
        target_horizons = [horizon] if horizon in (5, 10, 15) else [5, 10, 15]

        for h in target_horizons:
            forecast_time = now + timedelta(minutes=h)
            ml_info = ml_preds.get(h)

            if ml_info and ml_info["status"] == "available":
                p = CrowdPredictionSchema(
                    id=f"pred-{uuid.uuid4().hex[:8]}",
                    stationId=station_id,
                    platformId=platform_id,
                    generatedAt=now.isoformat(),
                    forecastAt=forecast_time.isoformat(),
                    horizonMinutes=h,
                    predictedCount=ml_info["predicted_count"],
                    predictedLevel=ml_info["predicted_level"],
                    confidenceScore=ml_info.get("confidence_score"),
                    status="available",
                    modelVersion=ml_info.get("model_version", "v1.0-rf"),
                    isDemo=False
                )
                results.append(p)
            else:
                # Check cached baseline if live model not ready
                cached_list = self._cache.get(key, [])
                match = next((cp for cp in cached_list if cp.horizon_minutes == h), None)
                if match:
                    # Update dynamic timestamps
                    p = match.model_copy(update={
                        "generated_at": now.isoformat(),
                        "forecast_at": forecast_time.isoformat()
                    })
                    results.append(p)
                else:
                    results.append(CrowdPredictionSchema(
                        id=f"pred-{uuid.uuid4().hex[:8]}",
                        stationId=station_id,
                        platformId=platform_id,
                        generatedAt=now.isoformat(),
                        forecastAt=forecast_time.isoformat(),
                        horizonMinutes=h,
                        predictedCount=None,
                        predictedLevel="unavailable",
                        confidenceScore=None,
                        status="insufficient_data" if not recent_counts else "unavailable",
                        modelVersion="v1.0-baseline",
                        isDemo=False
                    ))

        overall_status = "available" if any(r.status == "available" for r in results) else "unavailable"

        return PredictionResponseSchema(
            stationId=station_id,
            platformId=platform_id,
            predictions=results,
            overallStatus=overall_status
        )


prediction_service = PredictionService()
