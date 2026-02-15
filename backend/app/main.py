"""
Main FastAPI application.

This module initializes the FastAPI app, sets up middleware,
includes routers, and configures background tasks.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.api import agents, health, transactions, finance, email, agent_logs, auth
from app.database import init_db
from app.services.email_collector import get_email_collector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Envoy AI",
    description="Your Personal Chief of Staff",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, tags=["auth"])  # Auth router (no auth required)
app.include_router(health.router, tags=["health"])
app.include_router(agents.router, prefix="/api", tags=["agents"])
app.include_router(transactions.router, prefix="/api", tags=["transactions"])
app.include_router(finance.router, prefix="/api/finance", tags=["finance"])
app.include_router(email.router, prefix="/api/email", tags=["email"])
app.include_router(agent_logs.router, tags=["agent-logs"])

# Initialize background scheduler
scheduler = BackgroundScheduler()


def scheduled_email_processing():
    """Background task to process emails."""
    try:
        logger.info("Running scheduled email processing...")
        collector = get_email_collector()
        count = collector.process_unread_transactions()
        logger.info(f"Scheduled processing complete. Processed {count} emails.")
    except Exception as e:
        logger.error(f"Error in scheduled email processing: {e}")


@app.on_event("startup")
async def startup_event():
    """
    Startup event handler.
    
    Initializes database, starts scheduler, and triggers
    immediate email processing for testing.
    """
    logger.info("Starting Envoy AI application...")
    
    # Initialize database
    init_db()
    logger.info("Database initialized")
    
    # DISABLED: Email processing blocks the server startup
    # Email processing on startup only (no scheduler for now)
    # logger.info("Triggering email processing on startup...")
    # try:
    #     collector = get_email_collector()
    #     count = collector.process_unread_transactions()
    #     logger.info(f"Startup processing complete. Processed {count} emails.")
    # except Exception as e:
    #     logger.error(f"Error in startup email processing: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler."""
    logger.info("Shutting down Envoy AI application...")
    if scheduler.running:
        scheduler.shutdown()
    logger.info("Scheduler stopped")
