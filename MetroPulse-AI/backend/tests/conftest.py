"""Pytest configuration and fixtures for MetroPulse AI Backend tests."""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.main import app


@pytest.fixture(scope="session")
def client():
    """Shared TestClient instance."""
    with TestClient(app) as test_client:
        yield test_client
