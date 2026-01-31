"""
Parsers utility module.

This module contains text parsing functions for extracting structured data.
"""

import re
import os
import json
import logging
from litellm import completion

logger = logging.getLogger(__name__)

# Model configuration
MODEL = "groq/llama-3.3-70b-versatile"

def parse_transaction_with_llm(text: str) -> dict:
    """
    Parse transaction text using Groq's Llama model.
    
    Args:
        text: Transaction text to parse
        
    Returns:
        Dictionary with extracted transaction details
    """
    if not os.getenv("GROQ_API_KEY"):
        logger.warning("No GROQ_API_KEY, falling back to regex parsing")
        return parse_transaction_text_regex(text)
        
    try:
        response = completion(
            model=MODEL,
            messages=[
                {"role": "system", "content": """Extract transaction details. Return JSON only:
{"amount": <float>, "currency": "<INR/USD>", "merchant": "<name>", "category": "<Shopping/Food/Transport/Bills/Other>", "transaction_type": "<debit/credit>", "account_name": "<bank name or null>", "account_last4": "<4 digits or null>", "date": "<YYYY-MM-DD or null>"}"""},
                {"role": "user", "content": f"Extract from:\n{text}"}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        data = json.loads(response.choices[0].message.content)
        
        return {
            "amount": float(data.get("amount", 0.0)),
            "currency": data.get("currency", "INR"),
            "merchant": data.get("merchant", "Unknown"),
            "category": data.get("category", "Uncategorized"),
            "transaction_type": data.get("transaction_type", "debit").lower(),
            "account_name": data.get("account_name"),
            "account_last4": data.get("account_last4"),
            "date": data.get("date")
        }
        
    except Exception as e:
        logger.error(f"LLM parsing failed: {e}")
        return parse_transaction_text_regex(text)

def parse_transaction_text_regex(text: str) -> dict:
    """
    Fallback: Parse transaction text using regex patterns.
    """
    text_lower = text.lower()
    
    # Extract amount
    amount_match = re.search(r'rs\.?\s*(\d+[,\d]*)', text_lower)
    amount = float(amount_match.group(1).replace(',', '')) if amount_match else 0.0
    
    # Extract merchant
    merchant = "Unknown"
    merchant_patterns = [
        r'at\s+([a-z\s]+?)(?:\s+on|\s+for|$)',
        r'from\s+([a-z\s]+?)(?:\s+on|\s+for|$)',
        r'to\s+([a-z\s]+?)(?:\s+on|\s+for|$)',
    ]
    for pattern in merchant_patterns:
        match = re.search(pattern, text_lower)
        if match:
            merchant = match.group(1).strip().title()
            break
            
    # Transaction type
    transaction_type = "debit" if any(word in text_lower for word in ['debited', 'debit', 'paid', 'payment']) else "credit"
    
    # Category
    category = "Uncategorized"
    if any(word in text_lower for word in ['shopping', 'amazon', 'flipkart']):
        category = "Shopping"
    elif any(word in text_lower for word in ['food', 'restaurant', 'zomato', 'swiggy']):
        category = "Food"
    elif any(word in text_lower for word in ['uber', 'ola', 'transport', 'taxi']):
        category = "Transport"
    elif any(word in text_lower for word in ['bill', 'electricity', 'water', 'gas']):
        category = "Bills"
        
    # Account details
    account_name = None
    account_last4 = None
    
    account_patterns = [
        r'(?:card|a/c|account|ac)\s+(?:no\.?\s*)?(?:xx|ending\s+in\s+)?(\d{4})',
        r'(\w+\s+(?:credit|debit)\s+card)\s+(?:xx)?(\d{4})',
        r'(\w+\s+bank)\s+(?:a/c|account)\s+(?:xx)?(\d{4})',
    ]
    
    for pattern in account_patterns:
        match = re.search(pattern, text_lower)
        if match:
            if len(match.groups()) == 2:
                account_name = match.group(1).strip().title()
                account_last4 = match.group(2)
            else:
                account_last4 = match.group(1)
            break
            
    if not account_last4:
        last4_match = re.search(r'(?:xx|ending\s+in\s+|last\s+4\s+digits?\s+)(\d{4})', text_lower)
        if last4_match:
            account_last4 = last4_match.group(1)
            
    return {
        "amount": amount,
        "merchant": merchant,
        "category": category,
        "transaction_type": transaction_type,
        "currency": "INR",
        "account_name": account_name,
        "account_last4": account_last4,
        "date": None
    }

# Main export
def parse_transaction_text(text: str) -> dict:
    return parse_transaction_with_llm(text)
