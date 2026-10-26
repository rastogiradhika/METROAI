"""Supabase Database Integration for MetroPulse AI Backend.

Adheres to Section 9:
- Centralized database client access.
- Safe credential handling (never print in logs or responses).
- Clean separation: query tables defined in Sakshi's schema (stations, platforms, routes, etc.).
- When SUPABASE_URL / SUPABASE_ANON_KEY are not configured, gracefully falls back
  to local prototype storage and explicitly logs integration status.
"""

from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from app.core.config import settings
from app.core.logging import logger


class SupabaseManager:
    _instance: Optional["SupabaseManager"] = None
    _client: Optional[Client] = None
    _is_configured: bool = False

    def __init__(self):
        self._initialize()

    @classmethod
    def get_instance(cls) -> "SupabaseManager":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _initialize(self):
        url = settings.SUPABASE_URL
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

        if url and key and "supabase.co" in url and not key.startswith("your-"):
            try:
                self._client = create_client(url, key)
                self._is_configured = True
                logger.info("Supabase client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                self._client = None
                self._is_configured = False
        else:
            logger.info("Supabase credentials not configured or set to placeholder. Operating in local prototype store mode.")
            self._client = None
            self._is_configured = False

    @property
    def is_configured(self) -> bool:
        return self._is_configured

    @property
    def client(self) -> Optional[Client]:
        return self._client

    # Table Queries with explicit field selection
    async def fetch_stations(self) -> Optional[List[Dict[str, Any]]]:
        if not self._is_configured or not self._client:
            return None
        try:
            res = self._client.table("stations").select("id, name, code, line_names, interchange, latitude, longitude, platforms(id, name, direction)").execute()
            return res.data
        except Exception as e:
            logger.error(f"Supabase error fetching stations: {e}")
            return None

    async def fetch_station_by_id(self, station_id: str) -> Optional[Dict[str, Any]]:
        if not self._is_configured or not self._client:
            return None
        try:
            res = self._client.table("stations").select("id, name, code, line_names, interchange, latitude, longitude, platforms(id, name, direction)").eq("id", station_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.error(f"Supabase error fetching station {station_id}: {e}")
            return None

    async def fetch_routes(self) -> Optional[List[Dict[str, Any]]]:
        if not self._is_configured or not self._client:
            return None
        try:
            res = self._client.table("routes").select("*").execute()
            return res.data
        except Exception as e:
            logger.error(f"Supabase error fetching routes: {e}")
            return None

    async def fetch_latest_observation(self, station_id: str, platform_id: str) -> Optional[Dict[str, Any]]:
        if not self._is_configured or not self._client:
            return None
        try:
            res = self._client.table("crowd_observations").select("*").eq("station_id", station_id).eq("platform_id", platform_id).order("observed_at", desc=True).limit(1).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.error(f"Supabase error fetching latest observation: {e}")
            return None

    async def insert_crowd_observation(self, observation: Dict[str, Any]) -> bool:
        if not self._is_configured or not self._client:
            return False
        try:
            self._client.table("crowd_observations").insert(observation).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase error saving crowd observation: {e}")
            return False

    async def fetch_predictions(self, station_id: str, platform_id: str) -> Optional[List[Dict[str, Any]]]:
        if not self._is_configured or not self._client:
            return None
        try:
            res = self._client.table("predictions").select("*").eq("station_id", station_id).eq("platform_id", platform_id).order("forecast_at", desc=False).limit(3).execute()
            return res.data
        except Exception as e:
            logger.error(f"Supabase error fetching predictions: {e}")
            return None

    async def insert_predictions(self, predictions: List[Dict[str, Any]]) -> bool:
        if not self._is_configured or not self._client:
            return False
        try:
            self._client.table("predictions").insert(predictions).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase error saving predictions: {e}")
            return False

    async def fetch_passenger_reports(self) -> Optional[List[Dict[str, Any]]]:
        if not self._is_configured or not self._client:
            return None
        try:
            res = self._client.table("passenger_reports").select("*").order("reported_at", desc=True).limit(50).execute()
            return res.data
        except Exception as e:
            logger.error(f"Supabase error fetching reports: {e}")
            return None

    async def insert_passenger_report(self, report: Dict[str, Any]) -> bool:
        if not self._is_configured or not self._client:
            return False
        try:
            self._client.table("passenger_reports").insert(report).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase error saving passenger report: {e}")
            return False

    async def fetch_alerts(self, status: Optional[str] = None) -> Optional[List[Dict[str, Any]]]:
        if not self._is_configured or not self._client:
            return None
        try:
            query = self._client.table("alerts").select("*").order("created_at", desc=True)
            if status:
                query = query.eq("status", status)
            res = query.limit(50).execute()
            return res.data
        except Exception as e:
            logger.error(f"Supabase error fetching alerts: {e}")
            return None

    async def update_alert(self, alert_id: str, updates: Dict[str, Any]) -> bool:
        if not self._is_configured or not self._client:
            return False
        try:
            self._client.table("alerts").update(updates).eq("id", alert_id).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase error updating alert {alert_id}: {e}")
            return False

    async def insert_alert(self, alert: Dict[str, Any]) -> bool:
        if not self._is_configured or not self._client:
            return False
        try:
            self._client.table("alerts").insert(alert).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase error inserting alert: {e}")
            return False


supabase_manager = SupabaseManager.get_instance()
