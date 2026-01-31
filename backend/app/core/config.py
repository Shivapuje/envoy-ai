from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    app_name: str = "Envoy AI"
    debug: bool = True
    
    # LLM API Keys (at least one required)
    groq_api_key: Optional[str] = None      # FREE tier - recommended for testing
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    google_api_key: Optional[str] = None    # For Gemini (optional)
    
    # Model Configuration
    fast_model: str = "groq/llama3-70b-8192"
    reasoning_model: str = "groq/llama3-70b-8192"
    
    # Email Ingestion Configuration
    imap_server: str = "imap.gmail.com"
    email_user: str = ""
    email_pass: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Allow extra env vars without error


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
