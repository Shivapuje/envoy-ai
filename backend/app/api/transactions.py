"""
Transactions API endpoints.

This module provides API endpoints for viewing and managing transactions.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models import Transaction, ProcessedEmail

router = APIRouter()


class TransactionResponse(BaseModel):
    """Transaction response model."""
    id: int
    amount: float
    currency: str
    merchant: str
    category: str
    transaction_type: str
    email_subject: str
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get recent transactions.
    
    Args:
        limit: Maximum number of transactions to return
        db: Database session
        
    Returns:
        List of transactions
    """
    transactions = db.query(Transaction).order_by(
        Transaction.created_at.desc()
    ).limit(limit).all()
    
    return transactions


@router.get("/transactions/stats")
async def get_transaction_stats(db: Session = Depends(get_db)):
    """
    Get transaction statistics.
    
    Args:
        db: Database session
        
    Returns:
        Transaction statistics
    """
    total_transactions = db.query(Transaction).count()
    total_processed_emails = db.query(ProcessedEmail).count()
    
    return {
        "total_transactions": total_transactions,
        "total_processed_emails": total_processed_emails
    }
