"""Unit tests for Crowd Prediction APIs."""

import pytest
from fastapi.testclient import TestClient


def test_get_predictions_all_horizons(client: TestClient):
    response = client.get("/api/predictions/stn-001/plt-001-Y")
    assert response.status_code == 200
    data = response.json()
    assert data["stationId"] == "stn-001"
    assert data["platformId"] == "plt-001-Y"
    assert "predictions" in data
    assert len(data["predictions"]) == 3

    horizons = [p["horizonMinutes"] for p in data["predictions"]]
    assert 5 in horizons
    assert 10 in horizons
    assert 15 in horizons

    for p in data["predictions"]:
        assert "generatedAt" in p
        assert "forecastAt" in p
        assert p["generatedAt"] != p["forecastAt"]
        assert p["predictedLevel"] in ("low", "moderate", "high", "critical", "unavailable")


def test_get_predictions_single_horizon(client: TestClient):
    response = client.get("/api/predictions/stn-001/plt-001-Y?horizon=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data["predictions"]) == 1
    pred = data["predictions"][0]
    assert pred["horizonMinutes"] == 10


def test_get_predictions_invalid_horizon(client: TestClient):
    response = client.get("/api/predictions/stn-001/plt-001-Y?horizon=30")
    assert response.status_code == 400
    assert "one of [5, 10, 15]" in response.json()["message"]


def test_predictions_disclaimer_present(client: TestClient):
    response = client.get("/api/predictions/stn-001/plt-001-Y")
    data = response.json()
    assert "disclaimer" in data
    assert len(data["disclaimer"]) > 10
