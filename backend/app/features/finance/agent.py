from crewai import Agent, Task, Crew
from app.core.models import TransactionExtracted

def create_finance_crew(llm, text_input: str) -> dict:
    """
    Creates and runs a CrewAI crew to extract financial data from text.
    
    Args:
        llm: The Gemini LLM instance
        text_input: The text to analyze (email or SMS)
        
    Returns:
        dict: The extracted data as a dictionary
    """
    
    # Define Agent
    analyst = Agent(
        role='Senior Financial Analyst',
        goal='Extract precise financial data from unstructured text with 100% accuracy.',
        backstory="""You are an expert financial analyst with decades of experience in 
        auditing and data extraction. You specialize in parsing messy transaction emails, 
        SMS alerts, and bank statements to identify the exact vendor, amount, and category. 
        You never guess; if data is missing, you report it as such.""",
        allow_delegation=False,
        verbose=True,
        llm=llm
    )
    
    # Define Task
    extraction_task = Task(
        description=f"""
        Analyze the following text and extract the financial transaction details.
        
        Text: "{text_input}"
        
        Identify:
        - Exact amount (float)
        - Currency (default to INR if not specified but looks like indian context, else USD)
        - Vendor/Merchant name (clean it up, e.g., 'UBER *TRIP' -> 'Uber')
        - Category (Food, Transport, etc.)
        - Transaction type (debit/credit)
        - Date (if present)
        - Account details (name, last 4 digits)
        - Subscription status
        """,
        expected_output="A structured JSON object containing the transaction details.",
        agent=analyst,
        output_pydantic=TransactionExtracted
    )
    
    # Create Crew
    crew = Crew(
        agents=[analyst],
        tasks=[extraction_task],
        verbose=True
    )
    
    # Run
    result = crew.kickoff()
    
    # CrewAI kickoff returns a CrewOutput object, we need the pydantic model found in pydantic
    # Recent CrewAI versions return the pydantic object directly if output_pydantic is set, 
    # or inside the result object.
    
    # Safe handling of result
    if hasattr(result, 'pydantic') and result.pydantic:
        return result.pydantic.model_dump()
        
    # If it returns the model directly (sometimes happens in newer versions)
    if isinstance(result, TransactionExtracted):
        return result.model_dump()
        
    # Fallback if it returns raw string (shouldn't happen with output_pydantic)
    # But for safety, we might need to parse it if something goes wrong.
    # For now, assume it works as expected.
    
    # If result is a CrewOutput but pydantic is None, it might be in token usage or raw
    # Let's try to return dict from the object if it mimics the model
    try:
        return result.model_dump()
    except:
        pass
        
    return result
