"""
LLM Connection Test Script

This script verifies that the Google AI Studio API key is properly configured
and that we can successfully initialize a connection to the LLM.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

def test_llm_connection():
    """Test the LLM connection with Google AI Studio API."""
    
    # Load environment variables
    env_path = backend_dir / ".env"
    load_dotenv(env_path)
    
    # Get API key
    api_key = os.getenv("GOOGLE_API_KEY")
    
    if not api_key:
        print("❌ Error: GOOGLE_API_KEY not found in environment variables")
        print("Please create a .env file based on .env.example and add your API key")
        return False
    
    if api_key == "your_google_api_key_here" or len(api_key) < 10:
        print("❌ Error: GOOGLE_API_KEY is still set to placeholder value")
        print("Please update your .env file with a valid Google AI Studio API key")
        return False
    
    try:
        # Initialize ChatGoogleGenerativeAI
        model = os.getenv("FAST_MODEL", "gemini-1.5-flash")
        llm = ChatGoogleGenerativeAI(
            model=model,
            google_api_key=api_key,
            temperature=0.7
        )
        
        # Test with a simple message
        response = llm.invoke("Say 'Hello, Envoy AI!'")
        
        print("✅ LLM Connected")
        print(f"   Model: {model}")
        print(f"   Response: {response.content}")
        return True
        
    except Exception as e:
        print(f"❌ Error connecting to LLM: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_llm_connection()
    sys.exit(0 if success else 1)
