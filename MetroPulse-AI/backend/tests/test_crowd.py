"""Unit tests for Crowd Observation APIs and Threshold Classification."""

import pytest
from fastapi.testclient import TestClient
from app.integrations.ml_client import ml_client


def test_get_current_crowd_available(client: TestClient):
    response = client.get("/api/crowd/stn-001/plt-001-Y/current")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "available"
    obs = data["observation"]
    assert obs["stationId"] == "stn-001"
    assert obs["platformId"] == "plt-001-Y"
    assert obs["crowdLevel"] in ("low", "moderate", "high", "critical")
    assert obs["personCount"] is not None
    assert "observedAt" in obs


def test_get_current_crowd_unknown_platform(client: TestClient):
    response = client.get("/api/crowd/stn-999/plt-999/current")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "unavailable"
    assert data["observation"] is None


def test_get_crowd_history(client: TestClient):
    response = client.get("/api/crowd/stn-001/plt-001-Y/history")
    assert response.status_code == 200
    data = response.json()
    assert data["stationId"] == "stn-001"
    assert data["platformId"] == "plt-001-Y"
    assert isinstance(data["trendPoints"], list)
    assert len(data["trendPoints"]) > 0
    first_pt = data["trendPoints"][0]
    assert "time" in first_pt
    assert "crowdLevel" in first_pt


def test_crowd_threshold_classification():
    # Capacity = 300
    # <= 40% (120) -> low
    assert ml_client.classify_crowd_level(50, 300) == "low"
    assert ml_client.classify_crowd_level(120, 300) == "low"

    # 41-70% (121-210) -> moderate
    assert ml_client.classify_crowd_level(150, 300) == "moderate"
    assert ml_client.classify_crowd_level(210, 300) == "moderate"

    # 71-85% (211-255) -> high
    assert ml_client.classify_crowd_level(220, 300) == "high"
    assert ml_client.classify_crowd_level(255, 300) == "high"

    # > 85% (256+) -> critical
    assert ml_client.classify_crowd_level(270, 300) == "critical"

    # None -> unavailable
    assert ml_client.classify_crowd_level(None, 300) == "unavailable"


def test_post_people_count(client: TestClient):
    payload = {
        "stationId": "stn-001",
        "platformId": "plt-001-Y",
        "personCount": 180,
        "source": "cctv_test_edge"
    }
    response = client.post("/api/count", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    obs = data["observation"]
    assert obs["personCount"] == 180
    assert obs["crowdLevel"] == "moderate"


def test_invalid_station_id_characters(client: TestClient):
    response = client.get("/api/crowd/bad%20id!/plt-1/current")
    assert response.status_code == 400
