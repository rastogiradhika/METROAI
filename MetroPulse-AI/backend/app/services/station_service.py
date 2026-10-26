"""Station Service for MetroPulse AI Backend.

Handles station catalog retrieval, search, and platform inspection.
"""

from typing import List, Optional, Dict, Any
from app.core.config import settings
from app.core.logging import logger
from app.schemas.station import StationSchema, PlatformSchema, Coordinates
from app.integrations.supabase_client import supabase_manager


# Verified seed catalog matching Delhi Metro network and frontend sampleData
DEFAULT_STATIONS_DATA: List[Dict[str, Any]] = [
    {
        "id": "stn-001",
        "name": "Rajiv Chowk",
        "code": "RJC",
        "lineNames": ["Yellow Line", "Blue Line"],
        "interchange": True,
        "platforms": [
            {"id": "plt-001-Y", "name": "Platform 1", "direction": "Yellow Line – Northbound"},
            {"id": "plt-001-B", "name": "Platform 2", "direction": "Blue Line – Eastbound"},
        ],
        "coordinates": {"lat": 28.6328, "lng": 77.2197},
    },
    {
        "id": "stn-002",
        "name": "Kashmere Gate",
        "code": "KSG",
        "lineNames": ["Yellow Line", "Red Line", "Violet Line"],
        "interchange": True,
        "platforms": [
            {"id": "plt-002-Y", "name": "Platform 1", "direction": "Yellow Line – Northbound"},
            {"id": "plt-002-R", "name": "Platform 2", "direction": "Red Line – Eastbound"},
        ],
        "coordinates": {"lat": 28.6675, "lng": 77.2282},
    },
    {
        "id": "stn-003",
        "name": "Central Secretariat",
        "code": "CTS",
        "lineNames": ["Yellow Line", "Violet Line"],
        "interchange": True,
        "platforms": [
            {"id": "plt-003-Y", "name": "Platform 1", "direction": "Yellow Line – Southbound"},
            {"id": "plt-003-V", "name": "Platform 2", "direction": "Violet Line – Southbound"},
        ],
        "coordinates": {"lat": 28.6145, "lng": 77.2112},
    },
    {
        "id": "stn-004",
        "name": "New Delhi",
        "code": "NDL",
        "lineNames": ["Yellow Line", "Airport Express"],
        "interchange": True,
        "platforms": [
            {"id": "plt-004-Y", "name": "Platform 1", "direction": "Yellow Line"},
            {"id": "plt-004-A", "name": "Platform 2", "direction": "Airport Express"},
        ],
        "coordinates": {"lat": 28.6425, "lng": 77.2195},
    },
    {
        "id": "stn-005",
        "name": "Connaught Place",
        "code": "CNP",
        "lineNames": ["Blue Line"],
        "interchange": False,
        "platforms": [
            {"id": "plt-005-B", "name": "Platform 1", "direction": "Blue Line – Westbound"},
        ],
        "coordinates": {"lat": 28.6327, "lng": 77.2179},
    },
    {
        "id": "stn-006",
        "name": "Hauz Khas",
        "code": "HZK",
        "lineNames": ["Yellow Line", "Magenta Line"],
        "interchange": True,
        "platforms": [
            {"id": "plt-006-Y", "name": "Platform 1", "direction": "Yellow Line – Southbound"},
            {"id": "plt-006-M", "name": "Platform 2", "direction": "Magenta Line"},
        ],
        "coordinates": {"lat": 28.5435, "lng": 77.2066},
    },
    {
        "id": "stn-007",
        "name": "HUDA City Centre",
        "code": "HCC",
        "lineNames": ["Yellow Line"],
        "interchange": False,
        "platforms": [
            {"id": "plt-007-Y", "name": "Platform 1", "direction": "Yellow Line – Terminal"},
        ],
        "coordinates": {"lat": 28.4595, "lng": 77.0725},
    },
    {
        "id": "stn-008",
        "name": "Chandni Chowk",
        "code": "CCK",
        "lineNames": ["Yellow Line"],
        "interchange": False,
        "platforms": [
            {"id": "plt-008-Y", "name": "Platform 1", "direction": "Yellow Line – Southbound"},
        ],
        "coordinates": {"lat": 28.6578, "lng": 77.2301},
    },
]


class StationService:
    def __init__(self):
        self._stations: Dict[str, StationSchema] = {
            s["id"]: StationSchema(**s) for s in DEFAULT_STATIONS_DATA
        }

    async def get_all_stations(self, search: Optional[str] = None) -> List[StationSchema]:
        """Fetch all stations from Supabase or fallback catalog, optionally filtered by name/code."""
        if supabase_manager.is_configured:
            remote_data = await supabase_manager.fetch_stations()
            if remote_data:
                # Merge or replace
                parsed = []
                for item in remote_data:
                    platforms = [
                        PlatformSchema(id=p["id"], name=p["name"], direction=p.get("direction"))
                        for p in item.get("platforms", [])
                    ]
                    coords = None
                    if item.get("latitude") and item.get("longitude"):
                        coords = Coordinates(lat=item["latitude"], lng=item["longitude"])
                    parsed.append(StationSchema(
                        id=item["id"],
                        name=item["name"],
                        code=item["code"],
                        lineNames=item.get("line_names", []),
                        platforms=platforms,
                        coordinates=coords,
                        interchange=item.get("interchange", False)
                    ))
                stations_list = parsed
            else:
                stations_list = list(self._stations.values())
        else:
            stations_list = list(self._stations.values())

        if search:
            query = search.strip().lower()
            return [
                s for s in stations_list
                if query in s.name.lower() or query in s.code.lower()
            ]

        return stations_list

    async def get_station_by_id(self, station_id: str) -> Optional[StationSchema]:
        """Fetch a single station by its stable identifier."""
        if supabase_manager.is_configured:
            item = await supabase_manager.fetch_station_by_id(station_id)
            if item:
                platforms = [
                    PlatformSchema(id=p["id"], name=p["name"], direction=p.get("direction"))
                    for p in item.get("platforms", [])
                ]
                coords = None
                if item.get("latitude") and item.get("longitude"):
                    coords = Coordinates(lat=item["latitude"], lng=item["longitude"])
                return StationSchema(
                    id=item["id"],
                    name=item["name"],
                    code=item["code"],
                    lineNames=item.get("line_names", []),
                    platforms=platforms,
                    coordinates=coords,
                    interchange=item.get("interchange", False)
                )

        return self._stations.get(station_id)


station_service = StationService()
