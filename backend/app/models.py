"""
Database models for Envoy AI.

This module defines SQLAlchemy models for the application.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


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
    date = Column(DateTime)
    
    # Content
    body_text = Column(Text)
    body_html = Column(Text)
    
    # Processing
    is_processed = Column(Boolean, default=False)
    processed_by_agent = Column(String(50)) # finance, calendar, etc.
    processing_status = Column(String(50), default="pending") # pending, processed, failed
    ai_analysis = Column(Text) # JSON string of AI analysis (category, summary, etc.)
    
    # Timestamps
    fetched_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Email(message_id={self.message_id})>"
