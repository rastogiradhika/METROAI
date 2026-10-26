"""Timestamp and data freshness utilities for MetroPulse AI Backend.

Adheres to Section 19:
- Consistent UTC timezone-aware ISO 8601 format
- Explicit freshness evaluation (fresh, stale, expired)
- Never fabricate timestamps or treat stale observations as low crowd.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from app.core.config import settings


def now_utc() -> datetime:
    """Return current timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


def now_iso() -> str:
    """Return current UTC datetime as ISO 8601 string."""
    return now_utc().isoformat()


def parse_iso(ts_str: str) -> Optional[datetime]:
    """Parse an ISO 8601 string into a timezone-aware UTC datetime."""
    if not ts_str:
        return None
    try:
        # Handle 'Z' suffix
        cleaned = ts_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(cleaned)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        return None


def calculate_freshness(observed_at: datetime) -> str:
    """Determine freshness state based on configured time thresholds.

    Returns:
    - 'current' if age <= CROWD_FRESHNESS_SECONDS
    - 'stale' if CROWD_FRESHNESS_SECONDS < age <= CROWD_EXPIRY_SECONDS
    - 'expired' if age > CROWD_EXPIRY_SECONDS
    """
    age_seconds = (now_utc() - observed_at).total_seconds()
    if age_seconds < 0:
        # Observation from the near future (clock skew)
        return "current"
    if age_seconds <= settings.CROWD_FRESHNESS_SECONDS:
        return "current"
    if age_seconds <= settings.CROWD_EXPIRY_SECONDS:
        return "stale"
    return "expired"


def is_report_active(reported_at: datetime) -> bool:
    """Check if a passenger report has expired."""
    age_seconds = (now_utc() - reported_at).total_seconds()
    return age_seconds <= settings.REPORT_EXPIRY_SECONDS


def format_hh_mm(dt: datetime) -> str:
    """Format datetime as HH:mm string."""
    return dt.strftime("%H:%M")
