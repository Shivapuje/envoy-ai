"""
Authentication service for passkey-based authentication.

This module handles WebAuthn registration/login and JWT token management.
"""

import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import json

from jose import JWTError, jwt
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
    options_to_json,
)
from webauthn.helpers.structs import (
    PublicKeyCredentialDescriptor,
    AuthenticatorTransport,
    UserVerificationRequirement,
)
from webauthn.helpers.cose import COSEAlgorithmIdentifier
from sqlalchemy.orm import Session

from app.models import User, Credential


# Configuration from environment
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", "10080"))  # 7 days

# WebAuthn configuration
RP_ID = os.getenv("RP_ID", "localhost")
RP_NAME = os.getenv("RP_NAME", "Envoy AI")
RP_ORIGIN = os.getenv("RP_ORIGIN", "http://localhost:3000")


class AuthService:
    """Service for handling authentication operations."""
    
    def __init__(self):
        self.challenges: Dict[str, str] = {}  # In-memory challenge storage (use Redis in production)
    
    def generate_registration_options(self, username: str, display_name: str, db: Session) -> dict:
        """
        Generate WebAuthn registration options for a new user.
        
        Args:
            username: Unique username
            display_name: User's display name
            db: Database session
            
        Returns:
            Registration options as dict
        """
        # Check if user already exists
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            raise ValueError("Username already exists")
        
        # Generate challenge
        challenge = secrets.token_bytes(32)
        
        # Store challenge temporarily (keyed by username)
        self.challenges[username] = challenge.hex()
        
        # Generate registration options
        options = generate_registration_options(
            rp_id=RP_ID,
            rp_name=RP_NAME,
            user_id=username.encode('utf-8'),
            user_name=username,
            user_display_name=display_name,
            challenge=challenge,
            supported_pub_key_algs=[
                COSEAlgorithmIdentifier.ECDSA_SHA_256,
                COSEAlgorithmIdentifier.RSASSA_PKCS1_v1_5_SHA_256,
            ],
            authenticator_selection={
                "user_verification": UserVerificationRequirement.PREFERRED,
            },
        )
        
        return json.loads(options_to_json(options))
    
    def verify_registration(
        self,
        username: str,
        display_name: str,
        credential_data: dict,
        db: Session
    ) -> User:
        """
        Verify registration response and create user.
        
        Args:
            username: Username from registration
            display_name: Display name
            credential_data: WebAuthn credential response
            db: Database session
            
        Returns:
            Created User object
        """
        # Get stored challenge
        challenge_hex = self.challenges.get(username)
        if not challenge_hex:
            raise ValueError("No registration in progress for this user")
        
        challenge = bytes.fromhex(challenge_hex)
        
        # Verify the registration response
        verification = verify_registration_response(
            credential=credential_data,
            expected_challenge=challenge,
            expected_rp_id=RP_ID,
            expected_origin=RP_ORIGIN,
        )
        
        # Create user
        user = User(
            username=username,
            display_name=display_name,
        )
        db.add(user)
        db.flush()  # Get user.id
        
        # Store credential
        credential = Credential(
            user_id=user.id,
            credential_id=verification.credential_id.hex(),
            public_key=verification.credential_public_key,
            sign_count=verification.sign_count,
            transports=json.dumps([t.value for t in credential_data.get("transports", [])]),
        )
        db.add(credential)
        db.commit()
        db.refresh(user)
        
        # Clean up challenge
        del self.challenges[username]
        
        return user
    
    def generate_authentication_options(self, username: str, db: Session) -> dict:
        """
        Generate WebAuthn authentication options for login.
        
        Args:
            username: Username attempting to log in
            db: Database session
            
        Returns:
            Authentication options as dict
        """
        # Find user
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise ValueError("User not found")
        
        # Get user's credentials
        credentials = db.query(Credential).filter(Credential.user_id == user.id).all()
        if not credentials:
            raise ValueError("No credentials found for user")
        
        # Generate challenge
        challenge = secrets.token_bytes(32)
        self.challenges[username] = challenge.hex()
        
        # Create credential descriptors
        allow_credentials = [
            PublicKeyCredentialDescriptor(
                id=bytes.fromhex(cred.credential_id),
                transports=[AuthenticatorTransport(t) for t in json.loads(cred.transports or "[]")],
            )
            for cred in credentials
        ]
        
        # Generate authentication options
        options = generate_authentication_options(
            rp_id=RP_ID,
            challenge=challenge,
            allow_credentials=allow_credentials,
            user_verification=UserVerificationRequirement.PREFERRED,
        )
        
        return json.loads(options_to_json(options))
    
    def verify_authentication(
        self,
        username: str,
        credential_data: dict,
        db: Session
    ) -> User:
        """
        Verify authentication response and return user.
        
        Args:
            username: Username attempting to log in
            credential_data: WebAuthn authentication response
            db: Database session
            
        Returns:
            Authenticated User object
        """
        # Get stored challenge
        challenge_hex = self.challenges.get(username)
        if not challenge_hex:
            raise ValueError("No authentication in progress for this user")
        
        challenge = bytes.fromhex(challenge_hex)
        
        # Find user and credential
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise ValueError("User not found")
        
        credential_id_hex = bytes(credential_data["rawId"], 'utf-8').hex() if isinstance(credential_data.get("rawId"), str) else credential_data["id"]
        credential = db.query(Credential).filter(
            Credential.user_id == user.id,
            Credential.credential_id == credential_id_hex
        ).first()
        
        if not credential:
            raise ValueError("Credential not found")
        
        # Verify authentication
        verification = verify_authentication_response(
            credential=credential_data,
            expected_challenge=challenge,
            expected_rp_id=RP_ID,
            expected_origin=RP_ORIGIN,
            credential_public_key=credential.public_key,
            credential_current_sign_count=credential.sign_count,
        )
        
        # Update sign count and last used
        credential.sign_count = verification.new_sign_count
        credential.last_used_at = datetime.utcnow()
        db.commit()
        
        # Clean up challenge
        del self.challenges[username]
        
        return user
    
    def create_access_token(self, user_id: int, username: str) -> str:
        """
        Create JWT access token.
        
        Args:
            user_id: User's database ID
            username: Username
            
        Returns:
            JWT token string
        """
        expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION_MINUTES)
        to_encode = {
            "sub": str(user_id),
            "username": username,
            "exp": expire,
        }
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify JWT token and return payload.
        
        Args:
            token: JWT token string
            
        Returns:
            Token payload dict or None if invalid
        """
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            return payload
        except JWTError:
            return None


# Global instance
auth_service = AuthService()
