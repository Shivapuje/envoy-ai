from crewai import Agent, Task, Crew
from app.core.models import EmailAnalysis

def create_email_crew(llm, email_body: str) -> dict:
    """
    Creates and runs a CrewAI crew to triage an email.
    
    Args:
        llm: The Gemini LLM instance
        email_body: The email content
        
    Returns:
        dict: The analysis as a dictionary
    """
    
    # Define Agent
    assistant = Agent(
        role='Executive Assistant',
        goal='Filter noise and identify critical communications for a busy executive.',
        backstory="""You are an elite executive assistant who manages the inbox of a 
        high-profile tech CEO. Your job is to filter out spam, newsletters, and low-priority 
        Noise, while highlighting urgent business or personal matters. You are concise and decisive.""",
        allow_delegation=False,
        verbose=True,
        llm=llm
    )
    
    # Define Task
    triage_task = Task(
        description=f"""
        Analyze the following email and categorize it.
        
        Email Content: "{email_body}"
        
        Determine:
        1. Category: Urgent, Finance, Work, Newsletter, Spam, Personal, or Other.
        2. Urgency Score: 1-10 (10 is "Drop everything and read").
        3. Summary: One concise sentence.
        4. Action Required: Boolean.
        """,
        expected_output="A structured JSON object containing the email analysis.",
        agent=assistant,
        output_pydantic=EmailAnalysis
    )
    
    # Create Crew
    crew = Crew(
        agents=[assistant],
        tasks=[triage_task],
        verbose=True
    )
    
    # Run
    result = crew.kickoff()
    
    # Safe handling of result (CrewAI v0.x vs v1.x compatibility)
    if hasattr(result, 'pydantic') and result.pydantic:
        return result.pydantic.model_dump()
        
    if isinstance(result, EmailAnalysis):
        return result.model_dump()
        
    try:
        return result.model_dump()
    except:
        pass
        
    return result
