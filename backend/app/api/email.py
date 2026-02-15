from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import json
import logging
import re

from app.database import get_db
from app.models import Email, Transaction, AgentPreference
from app.services.email_collector import get_email_collector
from app.services.ai_engine import get_ai_engine

# Create router
router = APIRouter()
logger = logging.getLogger(__name__)

class EmailResponse(BaseModel):
    id: int
    subject: str
    sender: str
    date: datetime
    category: Optional[str] = "Uncategorized"
    summary: Optional[str] = "Pending analysis..."
    urgency_score: Optional[int] = 0
    action_required: Optional[bool] = False
    processing_status: str
    processed_by_agent: Optional[str]
    
    class Config:
        from_attributes = True

@router.post("/sync")
async def sync_emails(days: int = 30, db: Session = Depends(get_db)):
    """
    Connects to IMAP, downloads new emails, saves them as 'pending'.
    Does NOT run AI.
    """
    collector = get_email_collector()
    since_date = datetime.now() - timedelta(days=days)
    
    try:
        count = collector.process_unread_transactions(since_date=since_date)
        return {"status": "success", "new_emails": count}
    except Exception as e:
        logger.exception(e)
        raise HTTPException(status_code=500, detail=str(e))

def _process_finance_email(db: Session, ai_engine, email, email_text: str) -> dict:
    """
    Extract finance data from email and create a transaction.
    Returns the finance analysis result.
    """
    finance_result = ai_engine.run_finance_agent(email_text[:3000])
    
    if "error" in finance_result:
        return finance_result
    
    # Skip if amount is 0 or missing
    amount = finance_result.get("amount", 0)
    if not amount or amount == 0:
        logger.info(f"Skipping email {email.id} - no valid amount extracted")
        return {"skipped": True, "reason": "no_amount"}
    
    # Check if transaction already exists for this email
    existing = db.query(Transaction).filter(Transaction.email_message_id == email.message_id).first()
    if existing:
        logger.info(f"Transaction already exists for email {email.message_id}")
        return {"skipped": True, "reason": "duplicate"}
    
    # Create transaction record using correct model fields
    try:
        transaction = Transaction(
            email_message_id=email.message_id,
            amount=float(amount),
            currency=finance_result.get("currency", "INR"),
            merchant=finance_result.get("vendor") or finance_result.get("merchant") or "Unknown",
            category=finance_result.get("category", "Other"),
            transaction_type=finance_result.get("transaction_type", "debit"),
            email_subject=email.subject,
            email_from=email.sender,
            email_date=email.date,
            raw_email_text=email_text[:500]
        )
        db.add(transaction)
        logger.info(f"Created transaction: {transaction.merchant} - {transaction.amount}")
    except Exception as e:
        logger.error(f"Failed to create transaction: {e}")
        
    return finance_result

@router.post("/analyze-pending")
async def analyze_pending_emails(limit: int = 5, db: Session = Depends(get_db)):
    """
    Fetches emails with status='pending' and runs the AI Agent on them.
    If category is 'Finance', also runs Finance Agent.
    """
    ai_engine = get_ai_engine()
    
    try:
        pending_emails = db.query(Email).filter(
            Email.processing_status == "pending"
        ).order_by(Email.date.desc()).limit(limit).all()
        
        analyzed_count = 0
        finance_count = 0
        results = []
        
        for email in pending_emails:
            # Get email text
            text = email.body_text or ""
            if len(text) < 50 and email.body_html:
                text = re.sub('<[^<]+?>', '', email.body_html)
            
            # Skip empty content
            if len(text) < 10:
                email.processing_status = "skipped"
                continue
                
            # Run Email Triage Agent
            analysis = ai_engine.run_email_agent(text[:3000])
            
            if "error" in analysis:
                logger.error(f"Error analyzing email {email.id}: {analysis['error']}")
                results.append({"id": email.id, "status": "failed", "error": analysis['error']})
                continue
            
            # If category is Finance, run Finance Agent too
            category = analysis.get("category", "").lower()
            if category == "finance":
                finance_result = _process_finance_email(db, ai_engine, email, text)
                if "error" not in finance_result and not finance_result.get("skipped"):
                    analysis["finance_data"] = finance_result
                    finance_count += 1
            
            email.ai_analysis = json.dumps(analysis)
            email.processing_status = "processed"
            email.processed_by_agent = "email_triage" if category != "finance" else "email_triage+finance"
            analyzed_count += 1
            results.append({"id": email.id, "status": "success", "category": category})
        
        db.commit()
        return {
            "status": "success", 
            "analyzed_count": analyzed_count, 
            "finance_extracted": finance_count,
            "results": results
        }
        
    except Exception as e:
        logger.exception(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/{email_id}")
async def analyze_single_email(email_id: int, db: Session = Depends(get_db)):
    """
    Runs the AI Agent on a specific email (Manual Handover).
    If category is 'Finance', also runs Finance Agent.
    """
    ai_engine = get_ai_engine()
    
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
        
    try:
        text = email.body_text or ""
        if len(text) < 50 and email.body_html:
            text = re.sub('<[^<]+?>', '', email.body_html)
              
        analysis = ai_engine.run_email_agent(text[:3000])
        
        if "error" in analysis:
            raise HTTPException(status_code=500, detail=analysis["error"])
        
        # If category is Finance, run Finance Agent too
        category = analysis.get("category", "").lower()
        if category == "finance":
            finance_result = _process_finance_email(db, ai_engine, email, text)
            if "error" not in finance_result and not finance_result.get("skipped"):
                analysis["finance_data"] = finance_result
            
        email.ai_analysis = json.dumps(analysis)
        email.processing_status = "processed"
        email.processed_by_agent = "email_triage_manual" if category != "finance" else "email_triage_manual+finance"
        
        db.commit()
        
        return {"status": "success", "data": analysis}
        
    except Exception as e:
        logger.exception(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list", response_model=List[EmailResponse])
async def list_emails(limit: int = 200, db: Session = Depends(get_db)):
    """
    List emails (both pending and processed).
    Pending emails shown first, then ordered by date.
    """
    from sqlalchemy import case
    
    # Order: pending first, then by date descending
    emails = db.query(Email).order_by(
        case((Email.processing_status == "pending", 0), else_=1),
        Email.date.desc()
    ).limit(limit).all()
    
    result = []
    for email in emails:
        # Default values
        category = "Uncategorized"
        summary = "Pending analysis..."
        urgency_score = 0
        action_required = False
        
        if email.ai_analysis:
            try:
                data = json.loads(email.ai_analysis)
                category = data.get("category", "Uncategorized")
                summary = data.get("summary", "")
                urgency_score = data.get("urgency_score", 0)
                action_required = data.get("action_required", False)
            except:
                pass
        
        result.append({
            "id": email.id,
            "subject": email.subject or "(No Subject)",
            "sender": email.sender or "Unknown",
            "date": email.date or datetime.now(),
            "category": category,
            "summary": summary,
            "urgency_score": urgency_score,
            "action_required": action_required,
            "processing_status": email.processing_status,
            "processed_by_agent": email.processed_by_agent
        })
        
    return result


# === NEW ENDPOINTS FOR EMAIL MODAL & AGENT ASSIGNMENT ===

class EmailDetailResponse(BaseModel):
    id: int
    subject: str
    sender: str
    recipient: Optional[str]
    cc: Optional[str]
    date: datetime
    body_text: Optional[str]
    body_html: Optional[str]
    attachments: Optional[List[dict]] = []
    category: Optional[str] = "Uncategorized"
    summary: Optional[str]
    urgency_score: Optional[int] = 0
    action_required: Optional[bool] = False
    processing_status: str
    processed_by_agent: Optional[str]
    suggested_agents: List[str] = []


class AssignAgentsRequest(BaseModel):
    agent_ids: List[str]  # e.g., ["email", "finance"]
    remember: bool = False  # Save as preference


class PreferenceResponse(BaseModel):
    id: int
    sender_pattern: str
    subject_pattern: Optional[str]
    preferred_agents: str
    usage_count: int


@router.get("/{email_id}", response_model=EmailDetailResponse)
async def get_email_detail(email_id: int, db: Session = Depends(get_db)):
    """
    Get full email details including body content.
    """
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    # Parse AI analysis
    category = "Uncategorized"
    summary = None
    urgency_score = 0
    action_required = False
    
    if email.ai_analysis:
        try:
            data = json.loads(email.ai_analysis)
            category = data.get("category", "Uncategorized")
            summary = data.get("summary", "")
            urgency_score = data.get("urgency_score", 0)
            action_required = data.get("action_required", False)
        except:
            pass
    
    # Get suggested agents based on preferences
    suggested_agents = await _get_suggested_agents(email, db)
    
    # Parse attachments JSON
    attachments = []
    if email.attachments:
        try:
            attachments = json.loads(email.attachments)
        except:
            pass
    
    return {
        "id": email.id,
        "subject": email.subject or "(No Subject)",
        "sender": email.sender or "Unknown",
        "recipient": email.recipient,
        "cc": email.cc,
        "date": email.date or datetime.now(),
        "body_text": email.body_text,
        "body_html": email.body_html,
        "attachments": attachments,
        "category": category,
        "summary": summary,
        "urgency_score": urgency_score,
        "action_required": action_required,
        "processing_status": email.processing_status,
        "processed_by_agent": email.processed_by_agent,
        "suggested_agents": suggested_agents
    }


async def _get_suggested_agents(email: Email, db: Session) -> List[str]:
    """Find matching preferences for this email."""
    sender = (email.sender or "").lower()
    subject = (email.subject or "").lower()
    
    # Query preferences and check for matches
    preferences = db.query(AgentPreference).order_by(
        AgentPreference.usage_count.desc()
    ).limit(50).all()
    
    for pref in preferences:
        sender_match = pref.sender_pattern and pref.sender_pattern.lower() in sender
        subject_match = pref.subject_pattern and pref.subject_pattern.lower() in subject
        
        if sender_match or subject_match:
            return pref.preferred_agents.split(",")
    
    # Default suggestion based on content hints
    defaults = ["email"]
    if any(kw in subject for kw in ["statement", "payment", "transaction", "receipt", "order"]):
        defaults.append("finance")
    
    return defaults


@router.post("/{email_id}/assign")
async def assign_email_to_agents(
    email_id: int, 
    request: AssignAgentsRequest, 
    db: Session = Depends(get_db)
):
    """
    Assign an email to specific agents for processing.
    Optionally remembers the choice as a preference.
    """
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    ai_engine = get_ai_engine()
    email_text = f"Subject: {email.subject}\nFrom: {email.sender}\n\n{email.body_text or ''}"
    
    results = []
    
    for agent_id in request.agent_ids:
        try:
            if agent_id == "email":
                # Run email triage
                analysis = ai_engine.analyze_email(email_text, db_session=db)
                email.ai_analysis = json.dumps(analysis)
                email.processing_status = "processed"
                email.processed_by_agent = "email"
                results.append({"agent": "email", "status": "success", "data": analysis})
                
            elif agent_id == "finance":
                # Run finance extraction
                result = _process_finance_email(db, ai_engine, email, email_text)
                results.append({"agent": "finance", "status": "success", "data": result})
                
            else:
                results.append({"agent": agent_id, "status": "skipped", "message": "Agent not implemented"})
                
        except Exception as e:
            logger.exception(f"Error processing with {agent_id}: {e}")
            results.append({"agent": agent_id, "status": "error", "message": str(e)})
    
    # Save preference if requested
    if request.remember:
        await _save_preference(email, request.agent_ids, db)
    
    db.commit()
    
    return {"status": "success", "results": results}


async def _save_preference(email: Email, agent_ids: List[str], db: Session):
    """Save or update a preference based on the email sender."""
    sender = email.sender or ""
    
    # Extract domain or key identifier from sender
    sender_pattern = None
    if "@" in sender:
        # Try to get domain or recognizable part
        match = re.search(r'@([a-zA-Z0-9.-]+)', sender)
        if match:
            domain = match.group(1)
            # Use first part of domain (e.g., "amazon" from "amazon.in")
            sender_pattern = domain.split('.')[0]
    
    if not sender_pattern:
        return  # Can't create meaningful pattern
    
    # Check if preference already exists
    existing = db.query(AgentPreference).filter(
        AgentPreference.sender_pattern == sender_pattern
    ).first()
    
    agents_str = ",".join(agent_ids)
    
    if existing:
        existing.preferred_agents = agents_str
        existing.usage_count += 1
        existing.updated_at = datetime.utcnow()
    else:
        pref = AgentPreference(
            sender_pattern=sender_pattern,
            preferred_agents=agents_str
        )
        db.add(pref)


@router.get("/preferences/list", response_model=List[PreferenceResponse])
async def list_preferences(db: Session = Depends(get_db)):
    """Get all saved agent preferences."""
    prefs = db.query(AgentPreference).order_by(
        AgentPreference.usage_count.desc()
    ).limit(100).all()
    
    return [
        {
            "id": p.id,
            "sender_pattern": p.sender_pattern or "",
            "subject_pattern": p.subject_pattern,
            "preferred_agents": p.preferred_agents,
            "usage_count": p.usage_count
        }
        for p in prefs
    ]
