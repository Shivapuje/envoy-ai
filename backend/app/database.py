"""
Database configuration and session management.

This module provides database connection and session management.
Supports both SQLite (local dev) and PostgreSQL (Docker/production).
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.models import Base

# Read DATABASE_URL from environment, fallback to SQLite for local dev
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./envoy_ai.db")

# Engine configuration varies by database type
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False  # Required for SQLite

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,  # Verify connections are alive before using
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize database tables. Enables pgvector extension for PostgreSQL."""
    if not DATABASE_URL.startswith("sqlite"):
        try:
            from sqlalchemy import text as sa_text
            with engine.connect() as conn:
                conn.execute(sa_text("CREATE EXTENSION IF NOT EXISTS vector"))
                conn.commit()
        except Exception:
            pass  # Extension may already exist or not be available
    Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    """
    Get database session.
    
    Yields:
        Session: Database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
