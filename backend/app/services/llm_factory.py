"""
LLM Factory for creating language model instances.

This module provides factory functions and classes for creating LLM instances
with proper configuration from environment settings.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import get_settings


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""
    
    @abstractmethod
    def generate(self, prompt: str, **kwargs) -> str:
        """Generate a response from the LLM."""
        pass
    
    @abstractmethod
    def get_model_name(self) -> str:
        """Get the model name being used."""
        pass


class GoogleAIProvider(LLMProvider):
    """Google AI implementation of LLM provider using LangChain."""
    
    def __init__(self, model: str, api_key: str):
        self.model = model
        self.client = ChatGoogleGenerativeAI(
            model=model,
            google_api_key=api_key,
            temperature=0.7
        )
    
    def generate(self, prompt: str, **kwargs) -> str:
        """
        Generate a response using Google's Gemini API via LangChain.
        
        Args:
            prompt: The input prompt
            **kwargs: Additional parameters
        
        Returns:
            Generated text response
        """
        response = self.client.invoke(prompt)
        return response.content
    
    def get_model_name(self) -> str:
        """Get the Google AI model name."""
        return self.model


class LLMFactory:
    """
    Factory class for creating LLM providers.
    
    This factory allows for easy model selection and provider swapping.
    Currently supports Google AI, designed to easily add other providers.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self._providers: Dict[str, type] = {
            "google": GoogleAIProvider,
            # Future providers can be added here:
            # "anthropic": AnthropicProvider,
            # "ollama": OllamaProvider,
        }
        
        # Model type to configuration mapping
        self._model_configs = {
            "fast": {
                "provider": "google",
                "model": self.settings.fast_model,
            },
            "reasoning": {
                "provider": "google",
                "model": self.settings.reasoning_model,
            }
        }
    
    def get_model(self, model_type: str) -> LLMProvider:
        """
        Get an LLM provider instance based on model type.
        
        Args:
            model_type: Type of model ('fast' or 'reasoning')
        
        Returns:
            LLMProvider instance
        
        Raises:
            ValueError: If model_type is not recognized
        """
        if model_type not in self._model_configs:
            raise ValueError(
                f"Unknown model type: {model_type}. "
                f"Available types: {list(self._model_configs.keys())}"
            )
        
        config = self._model_configs[model_type]
        provider_class = self._providers[config["provider"]]
        
        # Instantiate provider with appropriate credentials
        if config["provider"] == "google":
            return provider_class(
                model=config["model"],
                api_key=self.settings.google_api_key
            )
        
        # Future provider instantiation logic can be added here
        raise NotImplementedError(f"Provider {config['provider']} not implemented")
    
    def register_provider(self, name: str, provider_class: type):
        """
        Register a new LLM provider.
        
        Args:
            name: Provider name
            provider_class: Provider class implementing LLMProvider
        """
        self._providers[name] = provider_class
    
    def configure_model(self, model_type: str, provider: str, model: str):
        """
        Configure a model type to use a specific provider and model.
        
        Args:
            model_type: Type of model ('fast', 'reasoning', or custom)
            provider: Provider name ('google', 'anthropic', etc.)
            model: Model identifier
        """
        self._model_configs[model_type] = {
            "provider": provider,
            "model": model,
        }


# Helper functions for LangChain integration
def create_llm(
    model: Optional[str] = None,
    temperature: float = 0.7,
    **kwargs
) -> ChatGoogleGenerativeAI:
    """
    Create a Google Gemini LLM instance with configuration from settings.
    
    Args:
        model: Model name to use. Defaults to fast_model from settings.
        temperature: Temperature for response generation.
        **kwargs: Additional arguments to pass to ChatGoogleGenerativeAI.
    
    Returns:
        ChatGoogleGenerativeAI: Configured LLM instance.
    
    Example:
        >>> llm = create_llm()
        >>> llm = create_llm(model="gemini-1.5-pro", temperature=0.5)
    """
    settings = get_settings()
    
    # Use provided model or default to fast_model from settings
    model_name = model or settings.fast_model
    
    # Create and return the LLM instance
    return ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=settings.google_api_key,
        temperature=temperature,
        **kwargs
    )


def create_reasoning_llm(
    temperature: float = 0.3,
    **kwargs
) -> ChatGoogleGenerativeAI:
    """
    Create a Google Gemini LLM instance optimized for reasoning tasks.
    
    Uses the reasoning_model from settings (typically gemini-1.5-pro)
    with a lower temperature for more focused, analytical responses.
    
    Args:
        temperature: Temperature for response generation. Default 0.3 for reasoning.
        **kwargs: Additional arguments to pass to ChatGoogleGenerativeAI.
    
    Returns:
        ChatGoogleGenerativeAI: Configured LLM instance for reasoning.
    
    Example:
        >>> reasoning_llm = create_reasoning_llm()
        >>> reasoning_llm = create_reasoning_llm(temperature=0.1)
    """
    settings = get_settings()
    
    return ChatGoogleGenerativeAI(
        model=settings.reasoning_model,
        google_api_key=settings.google_api_key,
        temperature=temperature,
        **kwargs
    )
