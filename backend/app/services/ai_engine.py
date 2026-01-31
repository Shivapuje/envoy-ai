"""
AI Engine using Groq (FREE tier) with Llama 3.
"""

import os
import logging
import json
from typing import Dict, Any
from litellm import completion

logger = logging.getLogger(__name__)

# Using Groq's current Llama 3.3 70B model
MODEL = "groq/llama-3.3-70b-versatile"

class AIEngine:
    """AI Engine using Groq (FREE tier)."""
    
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        
        if not self.api_key:
            logger.error("❌ GROQ_API_KEY not found!")
            logger.error("Get a FREE key at: https://console.groq.com/keys")
            self.available = False
        else:
            self.available = True
            logger.info("✅ Groq API key found - using Llama 3 70B (FREE)")
    
    def _call_llm(self, system_prompt: str, user_prompt: str) -> str:
        """Make a direct LLM call."""
        response = completion(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        return response.choices[0].message.content

    def run_finance_agent(self, text: str) -> dict:
        """Extract financial transaction details."""
        if not self.available:
            return {"error": "GROQ_API_KEY not set"}
            
        logger.info(f"Running Finance Agent with {MODEL}...")
        
        system_prompt = """You are a Financial Analyst. Extract transaction details.
Return JSON: {"amount": <float>, "currency": "<INR/USD>", "vendor": "<name>", "category": "<Food/Transport/Shopping/Other>", "transaction_type": "<debit/credit>", "date": "<YYYY-MM-DD or null>", "is_subscription": <boolean>}"""

        try:
            result = self._call_llm(system_prompt, f"Extract from:\n{text}")
            return json.loads(result)
        except Exception as e:
            logger.error(f"Finance Agent failed: {e}")
            return {"error": str(e)}

    def run_email_agent(self, text: str) -> dict:
        """Analyze and categorize an email."""
        if not self.available:
            return {"error": "GROQ_API_KEY not set"}
            
        logger.info(f"Running Email Agent with {MODEL}...")
        
        system_prompt = """You are an Executive Assistant triaging emails.
Return JSON: {"category": "<Urgent/Finance/Work/Newsletter/Spam/Personal/Other>", "urgency_score": <1-10>, "summary": "<one sentence>", "action_required": <boolean>}"""

        try:
            result = self._call_llm(system_prompt, f"Analyze:\n{text}")
            return json.loads(result)
        except Exception as e:
            logger.error(f"Email Agent failed: {e}")
            return {"error": str(e)}


ai_engine = AIEngine()

def get_ai_engine():
    return ai_engine
