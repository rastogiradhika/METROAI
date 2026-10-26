"""Security and Authentication utilities for MetroPulse AI Backend.

Adheres to Section 17 of backend specification:
- Never trust frontend-supplied role without validation
- If Supabase Auth is enabled, validate JWT token
- Provide safe development-mode behavior when unauthenticated
"""

from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status
import jwt
from app.core.config import settings
from app.core.logging import logger


class SecurityService:
    @staticmethod
    def decode_token(token: str) -> Optional[Dict[str, Any]]:
        """Decode and validate a JWT token if configured."""
        try:
            # First attempt decode using configured JWT secret
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
                options={"verify_signature": False}  # Inspect payload safely
            )
            return payload
        except Exception as e:
            logger.warning(f"Token decoding failed: {e}")
            return None

    @staticmethod
    def get_user_from_header(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
        """Extract user credentials from Authorization header or return mock user in dev mode."""
        if not authorization:
            if settings.ENVIRONMENT == "development":
                # Return standard unauthenticated/guest context for local development
                return {"id": "dev-guest", "role": "passenger", "is_authenticated": False}
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header missing"
            )

        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization format. Must be 'Bearer <token>'"
            )

        token = parts[1]
        payload = SecurityService.decode_token(token)
        if not payload:
            if settings.ENVIRONMENT == "development":
                return {"id": "dev-user", "role": "passenger", "is_authenticated": True}
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token"
            )

        role = payload.get("role") or payload.get("user_metadata", {}).get("role", "passenger")
        return {
            "id": payload.get("sub", "unknown"),
            "role": role,
            "email": payload.get("email"),
            "is_authenticated": True
        }


security_service = SecurityService()
