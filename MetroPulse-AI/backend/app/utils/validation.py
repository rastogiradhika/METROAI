"""Validation utilities for MetroPulse AI Backend.

Includes file upload security, path traversal prevention, and input validation.
"""

from pathlib import Path
import re
import uuid
from typing import Tuple, Optional
from fastapi import HTTPException, status
from app.core.config import settings


VALID_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_\-]+$")


def validate_identifier(val: str, field_name: str = "identifier") -> str:
    """Validate that an ID string contains only safe alphanumeric/hyphen characters."""
    if not val or not VALID_ID_PATTERN.match(val):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name}: '{val}'. Must contain only alphanumeric characters and hyphens."
        )
    return val


def sanitize_filename(filename: str) -> str:
    """Generate a safe, unique server-side filename with the original extension."""
    suffix = Path(filename).suffix.lower()
    if suffix not in settings.ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file extension '{suffix}'. Allowed: {settings.ALLOWED_VIDEO_EXTENSIONS}"
        )
    safe_name = f"video_{uuid.uuid4().hex[:12]}{suffix}"
    return safe_name


def validate_file_size(size_bytes: int) -> None:
    """Enforce maximum upload size limit."""
    if size_bytes > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Uploaded file exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB."
        )


def validate_video_content(file_path: Path) -> Tuple[int, int, float]:
    """Verify that the uploaded file is indeed a readable video stream.

    Returns:
    - (width, height, fps)
    Raises 400 if unreadable or corrupted.
    """
    import cv2
    cap = cv2.VideoCapture(str(file_path))
    if not cap.isOpened():
        cap.release()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file could not be decoded as a valid video stream."
        )

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    cap.release()

    if width <= 0 or height <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Video frame dimensions are invalid or zero."
        )

    return width, height, fps
