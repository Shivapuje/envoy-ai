"""
Database models for Envoy AI.

This module defines SQLAlchemy models for the application.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, LargeBinary
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class User(Base):
    """User model for authentication."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    display_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)  # Optional for recovery
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<User(id={self.id}, username={self.username})>"


class Credential(Base):
    """WebAuthn credential model for passkey authentication."""
    
    __tablename__ = "credentials"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # WebAuthn credential data
    credential_id = Column(String(1024), unique=True, nullable=False, index=True)
    public_key = Column(LargeBinary, nullable=False)
    sign_count = Column(Integer, default=0)
    transports = Column(Text)  # JSON array of supported transports
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<Credential(id={self.id}, user_id={self.user_id})>"


class Transaction(Base):
    """Transaction model for storing financial transactions."""
    
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    email_message_id = Column(String(255), unique=True, index=True, nullable=False)
    
    # Transaction details
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    merchant = Column(String(255))
    category = Column(String(100))
    transaction_type = Column(String(50))  # debit, credit, etc.
    
    # Account details
    account_name = Column(String(255))  # e.g., "HDFC Credit Card", "SBI Savings"
    account_last4 = Column(String(4))   # Last 4 digits for tracking
    
    # Email metadata
    email_subject = Column(String(500))
    email_from = Column(String(255))
    email_date = Column(DateTime)
    
    # AI extracted data
    raw_email_text = Column(Text)
    ai_analysis = Column(Text)  # JSON string of AI analysis
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Processing status
    is_processed = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<Transaction(id={self.id}, merchant={self.merchant}, amount={self.amount})>"


class ProcessedEmail(Base):
    """Model to track processed emails and prevent duplicates."""
    
    __tablename__ = "processed_emails"
    
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(String(255), unique=True, index=True, nullable=False)
    subject = Column(String(500))
    processed_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="processed")  # processed, error, skipped
    
    def __repr__(self):
        return f"<ProcessedEmail(message_id={self.message_id})>"


class Email(Base):
    """Model to store raw emails for the orchestrator."""
    
    __tablename__ = "emails"
    
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(String(255), unique=True, index=True, nullable=False)
    
    # Metadata
    subject = Column(String(500))
    sender = Column(String(255))
    recipient = Column(String(255))
    cc = Column(Text)  # Comma-separated CC recipients
    date = Column(DateTime)
    
    # Content
    body_text = Column(Text)
    body_html = Column(Text)
    attachments = Column(Text)  # JSON array of attachment info: [{name, size, mime_type}]
    
    # Processing
    is_processed = Column(Boolean, default=False)
    processed_by_agent = Column(String(50)) # finance, calendar, etc.
    processing_status = Column(String(50), default="pending") # pending, processed, failed
    ai_analysis = Column(Text) # JSON string of AI analysis (category, summary, etc.)
    
    # Timestamps
    fetched_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Email(message_id={self.message_id})>"


class AgentLog(Base):
    """Model to track agent executions for flow visualization."""
    
    __tablename__ = "agent_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(36), index=True, nullable=False)  # Groups related agents
    
    # Agent info
    agent_name = Column(String(50), nullable=False)  # email, finance, credit_card
    model_used = Column(String(100), nullable=False)  # groq/llama-3.3-70b, gpt-4o
    
    # Execution details
    input_summary = Column(String(200))  # First 200 chars of input
    output_summary = Column(String(500))  # Key result summary
    
    # Timing
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    duration_ms = Column(Integer)
    
    # Status
    status = Column(String(20), default="pending")  # pending, running, success, error
    error_message = Column(Text)
    
    # Chain tracking for handoffs
    parent_log_id = Column(Integer, index=True)  # For agent handoffs
    sequence_order = Column(Integer, default=0)  # Order in the chain
    
    # Extra data (JSON)
    extra_data = Column(Text)  # JSON string for extra data
    
    def __repr__(self):
        return f"<AgentLog(run_id={self.run_id}, agent={self.agent_name}, status={self.status})>"


class AgentPreference(Base):
    """Model to store user's learned preferences for agent assignments."""
    
    __tablename__ = "agent_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Pattern matching
    sender_pattern = Column(String(255), index=True)  # e.g., "amazon", "hdfc", "@newsletter"
    subject_pattern = Column(String(255))  # keywords like "order", "statement"
    
    # Preferred agents (comma-separated)
    preferred_agents = Column(String(255), nullable=False)  # e.g., "email,finance"
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    usage_count = Column(Integer, default=1)  # How often this preference was used
    
    def __repr__(self):
        return f"<AgentPreference(sender={self.sender_pattern}, agents={self.preferred_agents})>"
