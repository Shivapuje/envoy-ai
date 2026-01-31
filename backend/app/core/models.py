from pydantic import BaseModel, Field
from typing import Optional

class TransactionExtracted(BaseModel):
    """Structured output for transaction extraction."""
    amount: float = Field(..., description="Transaction amount")
    currency: str = Field(description="ISO Currency code, e.g., INR, USD", default="INR")
    vendor: str = Field(description="Normalized vendor name, e.g., 'Starbucks', 'Uber'")
    category: str = Field(description="One of: Food, Transport, Utilities, Shopping, Investment, Business, Health, Entertainment, Transfer, Uncategorized")
    transaction_type: str = Field(description="One of: debit, credit", default="debit")
    date: Optional[str] = Field(description="ISO Date YYYY-MM-DD if available", default=None)
    account_name: Optional[str] = Field(description="Account name if available", default=None)
    account_last4: Optional[str] = Field(description="Last 4 digits of account", default=None)
    is_subscription: bool = Field(description="True if this appears to be a recurring subscription", default=False)

class EmailAnalysis(BaseModel):
    """Structured output for email triage."""
    category: str = Field(description="One of: Urgent, Finance, Work, Newsletter, Spam, Personal, Other")
    summary: str = Field(description="1-sentence summary of the email")
    action_required: bool = Field(description="True if the user needs to take action")
    urgency_score: int = Field(description="1 to 10, where 10 is immediate attention needed", ge=1, le=10)
