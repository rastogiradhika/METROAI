"""Unit tests for Passenger Reports and Video Processing APIs."""

import io
import pytest
from fastapi.testclient import TestClient


def test_submit_passenger_report(client: TestClient):
    payload = {
        "stationId": "stn-002",
        "platformId": "plt-002-Y",
        "reportType": "high_crowd"
    }
    response = client.post("/api/reports", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["stationId"] == "stn-002"
    assert data["reportType"] == "high_crowd"
    assert data["status"] == "new"
    assert "reportedAt" in data


def test_passenger_report_rate_limit(client: TestClient):
    # Second immediate submission for the exact same station/platform must be rate limited
    payload = {
        "stationId": "stn-002",
        "platformId": "plt-002-Y",
        "reportType": "overcrowding"
    }
    response = client.post("/api/reports", json=payload)
    assert response.status_code == 429
    assert "recently" in response.json()["message"]


def test_list_passenger_reports(client: TestClient):
    response = client.get("/api/reports")
    assert response.status_code == 200
    data = response.json()
    assert "reports" in data
    assert "total" in data
    assert data["total"] >= 1


def test_video_upload_unsupported_format(client: TestClient):
    fake_file = io.BytesIO(b"fake text content")
    response = client.post(
        "/api/videos/upload",
        files={"file": ("malicious.txt", fake_file, "text/plain")},
        data={"stationId": "stn-001", "platformId": "plt-001-Y"}
    )
    assert response.status_code == 415


def test_video_job_unknown_id(client: TestClient):
    response = client.get("/api/videos/job-nonexistent-12345")
    assert response.status_code == 404
