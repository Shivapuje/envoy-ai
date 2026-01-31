"""
Finance API endpoints.

This module provides API endpoints for financial transaction management.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
import re

from app.database import get_db
from app.models import Transaction, Email
from app.services.email_collector import get_email_collector

router = APIRouter()


class EmailResponse(BaseModel):
    """Email response model."""
    id: int
    message_id: str
    subject: str
    sender: str
    date: str
    body_text: str
    is_processed: bool
    processing_status: str
    
    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    """Transaction response model."""
    id: int
    date: str
    vendor: str
    amount: float
    category: str
    status: str
    
    class Config:
        from_attributes = True


class ParseRequest(BaseModel):
    """Parse request model."""
    text: str


class ParseResponse(BaseModel):
    """Parse response model."""
    id: int
    date: str
    vendor: str
    amount: float
    category: str
    status: str
    message: str


@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get recent transactions.
    
    Args:
        limit: Maximum number of transactions to return (default: 50)
        db: Database session
        
    Returns:
        List of transactions with formatted data
    """
    transactions = db.query(Transaction).order_by(
        Transaction.created_at.desc()
    ).limit(limit).all()
    
    # Format transactions for frontend
    formatted_transactions = []
    for txn in transactions:
        formatted_transactions.append({
            "id": txn.id,
            "date": txn.email_date.strftime("%b %d") if txn.email_date else txn.created_at.strftime("%b %d"),
            "vendor": txn.merchant or "Unknown",
            "amount": txn.amount,
            "category": txn.category or "Uncategorized",
            "status": txn.transaction_type or "debit"
        })
    
    return formatted_transactions


@router.post("/fetch-emails")
async def fetch_emails_manually(since_date: str = None):
    """
    Manually trigger email fetching for testing.
    
    This endpoint allows manual triggering of email processing
    without blocking server startup.
    
    Args:
        since_date: Optional date string (YYYY-MM-DD) to fetch emails from.
                   If not provided, fetches all unread emails.
    
    Returns:
        dict: Number of emails processed and details
    """
    try:
        collector = get_email_collector()
        
        # Parse date if provided
        from_date = None
        if since_date:
            try:
                from_date = datetime.strptime(since_date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        count = collector.process_unread_transactions(since_date=from_date)
        
        return {
            "success": True,
            "message": f"Successfully processed {count} emails" + (f" since {since_date}" if since_date else ""),
            "count": count,
            "since_date": since_date
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing emails: {str(e)}")


@router.delete("/cleanup")
async def cleanup_data(db: Session = Depends(get_db)):
    """
    Delete all transactions and processed emails.
    """
    try:
        from app.models import ProcessedEmail
        # count entries to be deleted
        txn_count = db.query(Transaction).count()
        email_count = db.query(ProcessedEmail).count()
        
        db.query(Transaction).delete()
        db.query(ProcessedEmail).delete()
        db.commit()
        
        return {
            "success": True, 
            "message": f"Cleaned {txn_count} transactions and {email_count} processed email records"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/emails", response_model=List[EmailResponse])
async def get_emails(
    skip: int = 0, 
    limit: int = 50, 
    db: Session = Depends(get_db)
):
    """Get list of raw emails."""
    emails = db.query(Email).order_by(Email.date.desc()).offset(skip).limit(limit).all()
    
    formatted_emails = []
    for email in emails:
        formatted_emails.append({
            "id": email.id,
            "message_id": email.message_id,
            "subject": email.subject or "(No Subject)",
            "sender": email.sender or "Unknown",
            "date": email.date.strftime("%b %d, %Y %H:%M") if email.date else "Unknown",
            "body_text": email.body_text[:200] + "..." if email.body_text else "",
            "is_processed": email.is_processed,
            "processing_status": email.processing_status
        })
    
    return formatted_emails


@router.post("/emails/{email_id}/process")
async def process_email_manually(
    email_id: int, 
    agent_type: str = "finance",
    db: Session = Depends(get_db)
):
    """
    Manually route an email to a specific agent.
    """
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
        
    try:
        if agent_type == "finance":
            # Extract text from email
            text_content = email.body_text or ""
            if not text_content and email.body_html:
                # Naive HTML to text (should improve later)
                text_content = re.sub('<[^<]+?>', '', email.body_html)
            
            # Use Real AI Engine
            from app.services.ai_engine import get_ai_engine
            engine = get_ai_engine()
            
            # Call the Finance Crew
            parsed_data = engine.run_finance_agent(text_content + " " + email.subject)
            
            # Check for errors
            if "error" in parsed_data:
                raise HTTPException(status_code=500, detail=parsed_data["error"])
            
            # Create transaction (normalize fields from Agent output)
            transaction = Transaction(
                email_message_id=f"manual_{email.message_id}_{int(datetime.now().timestamp())}",
                amount=float(parsed_data.get("amount", 0.0)),
                currency=parsed_data.get("currency", "INR"),
                merchant=parsed_data.get("vendor", "Unknown") if "vendor" in parsed_data else parsed_data.get("merchant", "Unknown"),
                category=parsed_data.get("category", "Uncategorized"),
                transaction_type=parsed_data.get("transaction_type", "debit"),
                account_name=parsed_data.get("account_name"),
                account_last4=parsed_data.get("account_last4"),
                email_subject=email.subject,
                email_from=email.sender,
                email_date=email.date or datetime.utcnow(),
                raw_email_text=text_content,
                ai_analysis=str(parsed_data), # Store full analysis
                is_processed=True
            )
            
            db.add(transaction)
            
            # Update email status
            email.is_processed = True
            email.processing_status = "processed_ai"
            email.processed_by_agent = "finance_crew"
            
            db.commit()
            
            return {
                "success": True, 
                "message": "Email processed by Finance Crew",
                "extracted_data": parsed_data
            }
            
        else:
            return {"success": False, "message": f"Agent '{agent_type}' not supported yet"}
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))



from app.utils.parsers import parse_transaction_text


@router.post("/parse", response_model=ParseResponse)
async def parse_transaction(
    request: ParseRequest,
    db: Session = Depends(get_db)
):
    """
    Parse transaction text and save to database.
    
    Uses regex patterns to extract transaction details.
    
    Args:
        request: Parse request with transaction text
        db: Database session
        
    Returns:
        Parsed and saved transaction
    """
    if not request.text or len(request.text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Transaction text is too short")
    
    try:
        # Parse transaction using regex
        parsed_data = parse_transaction_text(request.text)
        
        # Create transaction record
        transaction = Transaction(
            email_message_id=f"manual_{datetime.utcnow().timestamp()}",
            amount=parsed_data["amount"],
            currency=parsed_data["currency"],
            merchant=parsed_data["merchant"],
            category=parsed_data["category"],
            transaction_type=parsed_data["transaction_type"],
            email_subject="Manual Entry",
            email_from="user@manual",
            email_date=datetime.utcnow(),
            raw_email_text=request.text,
            ai_analysis=f"Parsed: {parsed_data['merchant']}, {parsed_data['amount']}, {parsed_data['category']}",
            is_processed=True
        )
        
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        # Return formatted response
        return {
            "id": transaction.id,
            "date": transaction.created_at.strftime("%b %d"),
            "vendor": parsed_data["merchant"],
            "amount": parsed_data["amount"],
            "category": parsed_data["category"],
            "status": parsed_data["transaction_type"],
            "message": "Transaction parsed and saved successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error parsing transaction: {str(e)}")
