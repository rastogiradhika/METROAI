"""Unit tests for Alert Management APIs."""

import pytest
from fastapi.testclient import TestClient


def test_list_alerts(client: TestClient):
    response = client.get("/api/alerts")
    assert response.status_code == 200
    data = response.json()
    assert "alerts" in data
    assert "total" in data
    assert data["total"] >= 1
    first = data["alerts"][0]
    assert "id" in first
    assert "stationId" in first
    assert "type" in first
    assert "status" in first


def test_filter_alerts_by_status(client: TestClient):
    response = client.get("/api/alerts?status=active")
    assert response.status_code == 200
    data = response.json()
    for a in data["alerts"]:
        assert a["status"] == "active"


def test_get_single_alert(client: TestClient):
    response = client.get("/api/alerts/alt-001")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "alt-001"
    assert "Rajiv Chowk" in data["stationName"]


def test_get_unknown_alert(client: TestClient):
    response = client.get("/api/alerts/nonexistent-alert-999")
    assert response.status_code == 404


def test_update_alert_status(client: TestClient):
    payload = {"status": "acknowledged"}
    response = client.patch("/api/alerts/alt-001", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "acknowledged"
    assert data["acknowledgedAt"] is not None
