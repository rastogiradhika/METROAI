"""Unit tests for Station and Journey APIs."""

import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "app" in data
    assert "version" in data


def test_api_health_check(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_list_stations(client: TestClient):
    response = client.get("/api/stations")
    assert response.status_code == 200
    stations = response.json()
    assert isinstance(stations, list)
    assert len(stations) >= 5
    first = stations[0]
    assert "id" in first
    assert "name" in first
    assert "code" in first
    assert "lineNames" in first
    assert "platforms" in first


def test_list_stations_search(client: TestClient):
    response = client.get("/api/stations?search=Rajiv")
    assert response.status_code == 200
    stations = response.json()
    assert len(stations) == 1
    assert stations[0]["name"] == "Rajiv Chowk"


def test_get_valid_station(client: TestClient):
    response = client.get("/api/stations/stn-001")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "stn-001"
    assert data["name"] == "Rajiv Chowk"
    assert len(data["platforms"]) >= 2


def test_get_unknown_station(client: TestClient):
    response = client.get("/api/stations/unknown-999")
    assert response.status_code == 404
    data = response.json()
    assert "code" in data
    assert "message" in data


def test_journey_planner_valid_route(client: TestClient):
    response = client.get("/api/journey?from=stn-001&to=stn-002")
    assert response.status_code == 200
    route = response.json()
    assert route["sourceStationId"] == "stn-001"
    assert route["destinationStationId"] == "stn-002"
    assert len(route["stationSequence"]) >= 2
    assert route["totalStops"] >= 1


def test_journey_planner_identical_stations(client: TestClient):
    response = client.get("/api/journey?from=stn-001&to=stn-001")
    assert response.status_code == 400
    assert "identical" in response.json()["message"].lower()


def test_journey_planner_missing_params(client: TestClient):
    response = client.get("/api/journey")
    assert response.status_code == 400
