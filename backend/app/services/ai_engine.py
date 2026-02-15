"""
AI Engine with multi-model support, execution logging, and RAG context.
"""

import os
import uuid
import logging
import json
from datetime import datetime
from typing import Dict, Any, Optional
from litellm import completion

logger = logging.getLogger(__name__)

# Model configuration per agent type
MODEL_CONFIG = {
    "email": "groq/llama-3.3-70b-versatile",       # Fast, free
    "finance": "groq/llama-3.3-70b-versatile",     # Fast, free
    "credit_card": "openai/gpt-4o",                # High accuracy for statements
    "default": "groq/llama-3.3-70b-versatile"
}


class AIEngine:
    """AI Engine with multi-model support and execution logging."""
    
    def __init__(self):
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        
        # Check available providers
        self.providers = {}
        if self.groq_key:
            self.providers["groq"] = True
            logger.info("✅ Groq API key found")
        if self.openai_key:
            self.providers["openai"] = True
            logger.info("✅ OpenAI API key found")
            
        self.available = len(self.providers) > 0
        
        if not self.available:
            logger.error("❌ No API keys found! Set GROQ_API_KEY or OPENAI_API_KEY")
    
    def get_model_for_agent(self, agent_type: str) -> str:
        """Get the configured model for an agent type."""
        model = MODEL_CONFIG.get(agent_type, MODEL_CONFIG["default"])
        
        # Check if provider is available, fallback if not
        provider = model.split("/")[0]
        if provider not in self.providers:
            fallback = MODEL_CONFIG["default"]
            logger.warning(f"Provider {provider} not available, falling back to {fallback}")
            return fallback
        
        return model
    
    def _call_llm(self, model: str, system_prompt: str, user_prompt: str) -> str:
        """Make a direct LLM call with specified model."""
        response = completion(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        return response.choices[0].message.content

    def _get_rag_context(self, text: str, user_id: Optional[int] = None) -> str:
        """Retrieve RAG context for the given text. Returns empty string if unavailable."""
        try:
            from app.services.rag_service import get_rag_service
            rag = get_rag_service()
            return rag.build_context_prompt(text, user_id)
        except Exception as e:
            logger.debug(f"RAG context unavailable: {e}")
            return ""

    def _store_rag_context(self, email_id: Optional[int], text: str, analysis: dict, user_id: Optional[int] = None):
        """Store processed email analysis in RAG for future context."""
        if not email_id:
            return
        try:
            from app.services.rag_service import get_rag_service
            rag = get_rag_service()
            rag.store_email_context(email_id, text, analysis, user_id)
        except Exception as e:
            logger.debug(f"Failed to store RAG context: {e}")

    def run_finance_agent(self, text: str, run_id: Optional[str] = None, 
                          db_session=None, parent_log_id: Optional[int] = None,
                          user_id: Optional[int] = None, email_id: Optional[int] = None) -> dict:
        """Extract financial transaction details with RAG context."""
        if not self.available:
            return {"error": "No API keys configured"}
        
        run_id = run_id or str(uuid.uuid4())
        model = self.get_model_for_agent("finance")
        start_time = datetime.utcnow()
        
        logger.info(f"Running Finance Agent with {model}...")
        
        # Base prompt
        system_prompt = """You are a Financial Analyst. Extract transaction details.
Return JSON: {"amount": <float>, "currency": "<INR/USD>", "vendor": "<name>", "category": "<Food/Transport/Shopping/Other>", "transaction_type": "<debit/credit>", "date": "<YYYY-MM-DD or null>", "is_subscription": <boolean>}"""

        # Inject RAG context
        rag_context = self._get_rag_context(text, user_id)
        if rag_context:
            system_prompt += f"\n\nUse this context from similar past emails to improve accuracy:\n{rag_context}"

        try:
            result = self._call_llm(model, system_prompt, f"Extract from:\n{text}")
            parsed = json.loads(result)
            
            # Log execution
            self._log_execution(
                db_session=db_session,
                run_id=run_id,
                agent_name="finance",
                model_used=model,
                input_summary=text[:200],
                output_summary=f"{parsed.get('vendor', 'Unknown')}: {parsed.get('amount', 0)}",
                start_time=start_time,
                status="success",
                parent_log_id=parent_log_id
            )
            
            return parsed
        except Exception as e:
            logger.error(f"Finance Agent failed: {e}")
            self._log_execution(
                db_session=db_session,
                run_id=run_id,
                agent_name="finance",
                model_used=model,
                input_summary=text[:200],
                start_time=start_time,
                status="error",
                error_message=str(e),
                parent_log_id=parent_log_id
            )
            return {"error": str(e)}

    def run_email_agent(self, text: str, run_id: Optional[str] = None, 
                        db_session=None, user_id: Optional[int] = None,
                        email_id: Optional[int] = None) -> dict:
        """Analyze and categorize an email with RAG context."""
        if not self.available:
            return {"error": "No API keys configured"}
        
        run_id = run_id or str(uuid.uuid4())
        model = self.get_model_for_agent("email")
        start_time = datetime.utcnow()
            
        logger.info(f"Running Email Agent with {model}...")
        
        # Base prompt
        system_prompt = """You are an Executive Assistant triaging emails.
Return JSON: {"category": "<Urgent/Finance/Work/Newsletter/Spam/Personal/Other>", "urgency_score": <1-10>, "summary": "<one sentence>", "action_required": <boolean>}"""

        # Inject RAG context
        rag_context = self._get_rag_context(text, user_id)
        if rag_context:
            system_prompt += f"\n\nUse this context from similar past emails and user corrections to improve accuracy:\n{rag_context}"

        try:
            result = self._call_llm(model, system_prompt, f"Analyze:\n{text}")
            parsed = json.loads(result)
            
            # Store in RAG for future context
            self._store_rag_context(email_id, text, parsed, user_id)
            
            # Log execution
            log_id = self._log_execution(
                db_session=db_session,
                run_id=run_id,
                agent_name="email",
                model_used=model,
                input_summary=text[:200],
                output_summary=f"{parsed.get('category', 'Unknown')}: {parsed.get('summary', '')[:100]}",
                start_time=start_time,
                status="success"
            )
            
            # Add log metadata for chaining
            parsed["_run_id"] = run_id
            parsed["_log_id"] = log_id
            
            return parsed
        except Exception as e:
            logger.error(f"Email Agent failed: {e}")
            self._log_execution(
                db_session=db_session,
                run_id=run_id,
                agent_name="email",
                model_used=model,
                input_summary=text[:200],
                start_time=start_time,
                status="error",
                error_message=str(e)
            )
            return {"error": str(e)}
    
    def run_credit_card_agent(self, text: str, run_id: Optional[str] = None,
                              db_session=None) -> dict:
        """Extract credit card statement transactions including EMI details."""
        if not self.available:
            return {"error": "No API keys configured"}
        
        run_id = run_id or str(uuid.uuid4())
        model = self.get_model_for_agent("credit_card")
        start_time = datetime.utcnow()
        
        logger.info(f"Running Credit Card Agent with {model}...")
        
        system_prompt = """You are a Credit Card Statement Analyst. Extract all transactions from the statement.

For each transaction, extract:
- date: Transaction date (YYYY-MM-DD)
- description: Merchant/description
- amount: Transaction amount (positive for credits/payments, negative for debits/purchases)
- transaction_type: "debit" or "credit"
- category: Shopping/Dining/Travel/Bills/Entertainment/Fuel/EMI/Other

For EMI transactions, also extract:
- is_emi: true
- emi_principal: Principal amount
- emi_interest: Interest amount
- emi_gst: GST on interest (18%)
- emi_remaining_months: Remaining EMI count if available

Return JSON: {
    "statement_date": "<YYYY-MM-DD>",
    "card_last_4": "<last 4 digits>",
    "total_due": <amount>,
    "min_due": <amount>,
    "due_date": "<YYYY-MM-DD>",
    "transactions": [<list of transaction objects>],
    "summary": {
        "total_debits": <amount>,
        "total_credits": <amount>,
        "emi_count": <number>,
        "emi_total": <amount>
    }
}"""

        try:
            result = self._call_llm(model, system_prompt, f"Extract from statement:\n{text}")
            parsed = json.loads(result)
            
            # Log execution
            tx_count = len(parsed.get("transactions", []))
            self._log_execution(
                db_session=db_session,
                run_id=run_id,
                agent_name="credit_card",
                model_used=model,
                input_summary=text[:200],
                output_summary=f"Extracted {tx_count} transactions, Total: {parsed.get('total_due', 0)}",
                start_time=start_time,
                status="success"
            )
            
            return parsed
        except Exception as e:
            logger.error(f"Credit Card Agent failed: {e}")
            self._log_execution(
                db_session=db_session,
                run_id=run_id,
                agent_name="credit_card",
                model_used=model,
                input_summary=text[:200],
                start_time=start_time,
                status="error",
                error_message=str(e)
            )
            return {"error": str(e)}
    
    def _log_execution(self, db_session, run_id: str, agent_name: str, 
                       model_used: str, input_summary: str, start_time: datetime,
                       status: str, output_summary: str = None, 
                       error_message: str = None, parent_log_id: int = None) -> Optional[int]:
        """Log agent execution to database."""
        if not db_session:
            return None
        
        try:
            from app.models import AgentLog
            
            end_time = datetime.utcnow()
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            log = AgentLog(
                run_id=run_id,
                agent_name=agent_name,
                model_used=model_used,
                input_summary=input_summary,
                output_summary=output_summary,
                started_at=start_time,
                completed_at=end_time,
                duration_ms=duration_ms,
                status=status,
                error_message=error_message,
                parent_log_id=parent_log_id
            )
            
            db_session.add(log)
            db_session.commit()
            db_session.refresh(log)
            
            return log.id
        except Exception as e:
            logger.error(f"Failed to log execution: {e}")
            return None


ai_engine = AIEngine()

def get_ai_engine():
    return ai_engine
