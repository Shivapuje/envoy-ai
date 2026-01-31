"""
Email Collector Service - Optimized for speed.
"""

import logging
from datetime import datetime
from typing import Set
from imap_tools import MailBox, AND
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.database import SessionLocal
from app.models import Email

logger = logging.getLogger(__name__)


class EmailCollector:
    """Email collector - fetches and stores emails for AI processing."""
    
    def __init__(self):
        self.settings = get_settings()
        
    def process_unread_transactions(self, since_date: datetime = None) -> int:
        """
        Fetch new emails from IMAP and save to database.
        Optimized: Pre-loads existing message IDs to avoid per-email DB queries.
        """
        if not self.settings.email_user or not self.settings.email_pass:
            logger.warning("Email credentials not configured.")
            return 0
        
        new_count = 0
        db = SessionLocal()
        
        try:
            # Pre-load all existing message IDs in ONE query for fast duplicate check
            existing_ids: Set[str] = set(
                row[0] for row in db.query(Email.message_id).all()
            )
            logger.info(f"Loaded {len(existing_ids)} existing email IDs")
            
            with MailBox(self.settings.imap_server).login(
                self.settings.email_user,
                self.settings.email_pass
            ) as mailbox:
                
                logger.info(f"Connected to {self.settings.imap_server}")
                
                # Build criteria
                if since_date:
                    criteria = AND(date_gte=since_date.date())
                    logger.info(f"Fetching emails since {since_date.date()}")
                else:
                    criteria = AND(seen=False)
                    logger.info("Fetching unread emails")
                
                # Fetch emails
                for msg in mailbox.fetch(criteria, limit=100):  # Limit to 100 for speed
                    msg_id = str(msg.uid)
                    
                    # Fast in-memory duplicate check
                    if msg_id in existing_ids:
                        continue  # Skip silently - no DB query, no log spam
                    
                    # New email - save it
                    try:
                        email = Email(
                            message_id=msg_id,
                            subject=msg.subject or "(No Subject)",
                            sender=msg.from_ or "Unknown",
                            recipient=msg.to[0] if msg.to else "",
                            date=msg.date,
                            body_text=msg.text or "",
                            body_html=msg.html or "",
                            processing_status="pending"
                        )
                        db.add(email)
                        db.flush()  # Get ID without full commit
                        existing_ids.add(msg_id)  # Update cache
                        new_count += 1
                        logger.info(f"New: {msg.subject[:50]}...")
                    except Exception as e:
                        logger.error(f"Error saving: {e}")
                        db.rollback()
                
                db.commit()
                
        except Exception as e:
            logger.error(f"Email sync error: {e}")
        finally:
            db.close()
        
        logger.info(f"Synced {new_count} new emails")
        return new_count


# Singleton
_collector = None

def get_email_collector() -> EmailCollector:
    global _collector
    if _collector is None:
        _collector = EmailCollector()
    return _collector
