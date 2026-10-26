"""FastAPI Dependency Injection helpers."""

from typing import Dict, Any, Optional
from fastapi import Depends, Header, HTTPException, status
from app.core.security import security_service
from app.integrations.supabase_client import supabase_manager, SupabaseManager


def get_db() -> SupabaseManager:
    """Dependency providing database access manager."""
    return supabase_manager


def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Dependency extracting validated user or dev guest context."""
    return security_service.get_user_from_header(authorization)


def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Dependency enforcing admin privileges."""
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges are required for this operation."
        )
    return user
