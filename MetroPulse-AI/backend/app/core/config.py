"""Application Configuration for MetroPulse AI Backend.

Loaded via pydantic-settings from environment variables or .env file.
"""

from pathlib import Path
from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
WORKSPACE_ROOT = BACKEND_ROOT.parent


class Settings(BaseSettings):
    # Application identity
    APP_NAME: str = "MetroPulse AI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api"

    # Server binding
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "*"
    ]

    # Supabase credentials (optional for demo/local mode)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None

    # Video upload and storage
    UPLOAD_DIR: Path = BACKEND_ROOT / "uploads"
    MAX_UPLOAD_SIZE_BYTES: int = 50 * 1024 * 1024  # 50 MB
    ALLOWED_VIDEO_EXTENSIONS: List[str] = [".mp4", ".avi", ".mov", ".mkv", ".webm"]
    ALLOWED_VIDEO_MIME_TYPES: List[str] = [
        "video/mp4",
        "video/x-msvideo",
        "video/quicktime",
        "video/x-matroska",
        "video/webm",
        "application/octet-stream"
    ]
    MAX_PROCESSING_FRAMES: int = 300
    FRAME_SAMPLE_RATE: int = 5  # Process 1 in every 5 frames on CPU

    # ML Configuration
    ML_DEVICE: str = "cpu"
    YOLO_MODEL_PATH: Path = WORKSPACE_ROOT / "ml" / "weights" / "yolo11n.pt"
    FALLBACK_YOLO_PATH: Path = WORKSPACE_ROOT.parent / "metro-ai" / "yolo11n.pt"
    PREDICTION_MODELS_DIR: Path = WORKSPACE_ROOT / "ml" / "trained_models"
    DATA_STATIC_DIR: Path = WORKSPACE_ROOT / "data" / "metro_static"
    DATA_PROTOTYPE_DIR: Path = WORKSPACE_ROOT / "data" / "prototype"

    # Crowd freshness and classification
    CROWD_FRESHNESS_SECONDS: int = 300  # 5 minutes
    CROWD_EXPIRY_SECONDS: int = 900      # 15 minutes = unavailable/expired
    DEFAULT_PLATFORM_CAPACITY: int = 300

    # Occupancy thresholds (prototype classification)
    THRESHOLD_LOW_PCT: float = 40.0
    THRESHOLD_MODERATE_PCT: float = 70.0
    THRESHOLD_HIGH_PCT: float = 85.0

    # Passenger Reports
    REPORT_EXPIRY_SECONDS: int = 1800  # 30 minutes
    REPORT_RATE_LIMIT_SECONDS: int = 60  # 1 report per station/platform per minute

    # Alerts configuration
    ALERT_COOLDOWN_SECONDS: int = 300  # Cooldown between duplicate alerts
    ALERT_AUTO_RESOLVE_SECONDS: int = 1200  # 20 minutes

    # Security
    JWT_SECRET_KEY: str = "metropulse-dev-secret-key-change-in-production-12345"
    JWT_ALGORITHM: str = "HS256"

    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @field_validator("UPLOAD_DIR", mode="after")
    @classmethod
    def ensure_upload_dir(cls, v: Path) -> Path:
        v.mkdir(parents=True, exist_ok=True)
        return v


settings = Settings()
