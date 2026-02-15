"""
Authentication API endpoints.

Handles passkey registration and login.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.services.auth_service import auth_service
from app.models import User

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


# Request/Response models
class RegisterBeginRequest(BaseModel):
    username: str
    display_name: str


class RegisterCompleteRequest(BaseModel):
    username: str
    display_name: str
    credential: dict


class LoginBeginRequest(BaseModel):
    username: str


class LoginCompleteRequest(BaseModel):
    username: str
    credential: dict


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: int
    username: str
    display_name: str
    email: Optional[str]
    
    class Config:
        from_attributes = True


# Dependency to get current user from JWT
def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token.
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = auth_service.verify_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    return user


# Optional dependency for routes that work with or without auth
def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, None otherwise."""
    if not credentials:
        return None
    
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None


# Endpoints
@router.post("/register/begin")
def register_begin(request: RegisterBeginRequest, db: Session = Depends(get_db)):
    """
    Begin passkey registration process.
    
    Returns WebAuthn registration options.
    """
    try:
        options = auth_service.generate_registration_options_for_user(
            username=request.username,
            display_name=request.display_name,
            db=db
        )
        return options
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Register begin error: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/register/complete", response_model=TokenResponse)
def register_complete(request: RegisterCompleteRequest, db: Session = Depends(get_db)):
    """
    Complete passkey registration.
    
    Creates user and returns JWT token.
    """
    try:
        user = auth_service.verify_registration(
            username=request.username,
            display_name=request.display_name,
            credential_data=request.credential,
            db=db
        )
        
        access_token = auth_service.create_access_token(
            user_id=user.id,
            username=user.username
        )
        
        return TokenResponse(
            access_token=access_token,
            user={
                "id": user.id,
                "username": user.username,
                "display_name": user.display_name,
                "email": user.email,
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Register complete error: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/login/begin")
def login_begin(request: LoginBeginRequest, db: Session = Depends(get_db)):
    """
    Begin passkey login process.
    
    Returns WebAuthn authentication options.
    """
    try:
        options = auth_service.generate_authentication_options_for_user(
            username=request.username,
            db=db
        )
        return options
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Login begin error: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/login/complete", response_model=TokenResponse)
def login_complete(request: LoginCompleteRequest, db: Session = Depends(get_db)):
    """
    Complete passkey login.
    
    Verifies authentication and returns JWT token.
    """
    try:
        user = auth_service.verify_authentication(
            username=request.username,
            credential_data=request.credential,
            db=db
        )
        
        access_token = auth_service.create_access_token(
            user_id=user.id,
            username=user.username
        )
        
        return TokenResponse(
            access_token=access_token,
            user={
                "id": user.id,
                "username": user.username,
                "display_name": user.display_name,
                "email": user.email,
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Login complete error: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user info.
    """
    return current_user


@router.post("/logout")
def logout():
    """
    Logout endpoint (client should discard token).
    """
    return {"message": "Logged out successfully"}
