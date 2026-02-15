"""
Authentication service for passkey-based authentication.

This module handles WebAuthn registration/login and JWT token management.
"""

import os
import secrets
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import json
import base64

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
    AuthenticatorSelectionCriteria,
)
from webauthn.helpers.cose import COSEAlgorithmIdentifier
from sqlalchemy.orm import Session

from app.models import User, Credential

logger = logging.getLogger(__name__)

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
        self.challenges: Dict[str, str] = {}  # In-memory challenge storage

    def _reg_options(self, username: str, display_name: str) -> dict:
        """Generate WebAuthn registration options."""
        challenge = secrets.token_bytes(32)
        self.challenges[username] = challenge.hex()

        options = generate_registration_options(
            rp_id=RP_ID,
            rp_name=RP_NAME,
            user_id=username.encode("utf-8"),
            user_name=username,
            user_display_name=display_name,
            challenge=challenge,
            supported_pub_key_algs=[
                COSEAlgorithmIdentifier.ECDSA_SHA_256,
                COSEAlgorithmIdentifier.RSASSA_PKCS1_v1_5_SHA_256,
            ],
            authenticator_selection=AuthenticatorSelectionCriteria(
                user_verification=UserVerificationRequirement.PREFERRED,
            ),
        )

        return json.loads(options_to_json(options))

    def generate_registration_options_for_user(
        self, username: str, display_name: str, db: Session
    ) -> dict:
        """Generate WebAuthn registration options for a new user."""
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            raise ValueError("Username already exists")

        return self._reg_options(username, display_name)

    def verify_registration(
        self,
        username: str,
        display_name: str,
        credential_data: dict,
        db: Session,
    ) -> User:
        """Verify registration response and create user + credential."""
        challenge_hex = self.challenges.get(username)
        if not challenge_hex:
            raise ValueError("No registration in progress for this user")

        challenge = bytes.fromhex(challenge_hex)

        logger.info("Verifying registration for user=%s, rp_id=%s, origin=%s", username, RP_ID, RP_ORIGIN)

        try:
            verification = verify_registration_response(
                credential=credential_data,
                expected_challenge=challenge,
                expected_rp_id=RP_ID,
                expected_origin=RP_ORIGIN,
            )
        except Exception as exc:
            logger.error("Registration verification failed: %s", exc)
            raise ValueError(f"Registration verification failed: {exc}")

        # Create user
        user = User(username=username, display_name=display_name)
        db.add(user)
        db.flush()

        # Extract transports from credential_data safely
        transports_raw = credential_data.get("response", {}).get("transports", [])
        if not transports_raw:
            transports_raw = credential_data.get("transports", [])

        credential = Credential(
            user_id=user.id,
            credential_id=verification.credential_id.hex(),
            public_key=verification.credential_public_key,
            sign_count=verification.sign_count,
            transports=json.dumps(transports_raw),
        )
        db.add(credential)
        db.commit()
        db.refresh(user)

        del self.challenges[username]
        logger.info("User registered: id=%d username=%s", user.id, user.username)
        return user

    def generate_authentication_options_for_user(
        self, username: str, db: Session
    ) -> dict:
        """Generate WebAuthn authentication options for login."""
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise ValueError("User not found")

        credentials = (
            db.query(Credential).filter(Credential.user_id == user.id).all()
        )
        if not credentials:
            raise ValueError("No credentials found for user")

        challenge = secrets.token_bytes(32)
        self.challenges[username] = challenge.hex()

        allow_credentials = []
        for cred in credentials:
            try:
                stored_transports = json.loads(cred.transports or "[]")
                transports = [
                    AuthenticatorTransport(t)
                    for t in stored_transports
                    if t in [e.value for e in AuthenticatorTransport]
                ]
            except Exception:
                transports = []

            allow_credentials.append(
                PublicKeyCredentialDescriptor(
                    id=bytes.fromhex(cred.credential_id),
                    transports=transports if transports else None,
                )
            )

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
        db: Session,
    ) -> User:
        """Verify authentication response and return user."""
        challenge_hex = self.challenges.get(username)
        if not challenge_hex:
            raise ValueError("No authentication in progress for this user")

        challenge = bytes.fromhex(challenge_hex)

        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise ValueError("User not found")

        # Find credential by rawId (base64url) or id field
        raw_id = credential_data.get("rawId") or credential_data.get("id", "")
        try:
            # rawId comes as base64url from SimpleWebAuthn
            cred_id_bytes = base64.urlsafe_b64decode(raw_id + "==")
            cred_id_hex = cred_id_bytes.hex()
        except Exception:
            cred_id_hex = raw_id

        credential = (
            db.query(Credential)
            .filter(
                Credential.user_id == user.id,
                Credential.credential_id == cred_id_hex,
            )
            .first()
        )

        if not credential:
            logger.error(
                "Credential not found for user=%s, cred_id_hex=%s",
                username, cred_id_hex,
            )
            raise ValueError("Credential not found")

        logger.info("Verifying authentication for user=%s", username)

        try:
            verification = verify_authentication_response(
                credential=credential_data,
                expected_challenge=challenge,
                expected_rp_id=RP_ID,
                expected_origin=RP_ORIGIN,
                credential_public_key=credential.public_key,
                credential_current_sign_count=credential.sign_count,
            )
        except Exception as exc:
            logger.error("Authentication verification failed: %s", exc)
            raise ValueError(f"Authentication verification failed: {exc}")

        credential.sign_count = verification.new_sign_count
        credential.last_used_at = datetime.utcnow()
        db.commit()

        del self.challenges[username]
        logger.info("User authenticated: id=%d username=%s", user.id, user.username)
        return user

    def create_access_token(self, user_id: int, username: str) -> str:
        """Create JWT access token."""
        expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION_MINUTES)
        to_encode = {
            "sub": str(user_id),
            "username": username,
            "exp": expire,
        }
        return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token and return payload."""
        try:
            return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        except JWTError:
            return None


# Global instance
auth_service = AuthService()
