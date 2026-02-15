"""
Transactions API endpoints.

This module provides API endpoints for viewing and managing transactions.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models import Transaction, ProcessedEmail, User
from app.api.auth import get_active_user

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
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_active_user),
):
    """
    Get recent transactions scoped to current user.
    """
    query = db.query(Transaction)
    if current_user:
        query = query.filter(Transaction.user_id == current_user.id)
    
    transactions = query.order_by(
        Transaction.created_at.desc()
    ).limit(limit).all()
    
    return transactions


@router.get("/transactions/stats")
async def get_transaction_stats(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_active_user),
):
    """
    Get transaction statistics scoped to current user.
    """
    txn_query = db.query(Transaction)
    pe_query = db.query(ProcessedEmail)
    if current_user:
        txn_query = txn_query.filter(Transaction.user_id == current_user.id)
        pe_query = pe_query.filter(ProcessedEmail.user_id == current_user.id)
    
    return {
        "total_transactions": txn_query.count(),
        "total_processed_emails": pe_query.count(),
    }
