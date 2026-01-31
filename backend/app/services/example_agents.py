from typing import Any, List, Dict
from app.core.agent_base import BaseAgent, TaskPacket, AgentTool
from app.services.llm_factory import LLMFactory


class SimpleAssistantAgent(BaseAgent):
    """
    Example agent implementation using the LLM factory.
    
    This agent demonstrates:
    - How to extend BaseAgent
    - Integration with the LLM factory
    - Tool definition and usage
    - TaskPacket creation
    """
    
    def __init__(self, model_type: str = "fast"):
        """
        Initialize the assistant agent.
        
        Args:
            model_type: Type of model to use ('fast' or 'reasoning')
        """
        super().__init__()
        self.model_type = model_type
        self.llm_factory = LLMFactory()
        self.llm = self.llm_factory.get_model(model_type)
    
    @property
    def name(self) -> str:
        """Agent identifier."""
        return f"assistant_{self.model_type}"
    
    def process(self, input_data: Any) -> TaskPacket:
        """
        Process input using the LLM.
        
        Args:
            input_data: Can be a string prompt or dict with 'prompt' key
        
        Returns:
            TaskPacket with LLM response
        """
        # Extract prompt from input
        if isinstance(input_data, str):
            prompt = input_data
        elif isinstance(input_data, dict):
            prompt = input_data.get("prompt", str(input_data))
        else:
            prompt = str(input_data)
        
        # Generate response using LLM
        try:
            response_text = self.llm.generate(prompt)
            
            return self.create_response(
                data={
                    "response": response_text,
                    "model": self.llm.get_model_name(),
                    "agent": self.name
                },
                metadata={
                    "model_type": self.model_type,
                    "success": True
                }
            )
        except Exception as e:
            return self.create_response(
                data={
                    "error": str(e),
                    "agent": self.name
                },
                metadata={
                    "model_type": self.model_type,
                    "success": False,
                    "error": True
                }
            )
    
    def get_tools(self) -> List[AgentTool]:
        """
        Define tools available to this agent.
        
        Returns:
            List of AgentTool definitions
        """
        return [
            AgentTool(
                name="generate_text",
                description="Generate text using an LLM",
                parameters={
                    "type": "object",
                    "properties": {
                        "prompt": {
                            "type": "string",
                            "description": "The prompt to send to the LLM"
                        },
                        "temperature": {
                            "type": "number",
                            "description": "Sampling temperature (0-2)",
                            "default": 0.7
                        }
                    },
                    "required": ["prompt"]
                }
            ),
            AgentTool(
                name="summarize",
                description="Summarize text content",
                parameters={
                    "type": "object",
                    "properties": {
                        "text": {
                            "type": "string",
                            "description": "Text to summarize"
                        },
                        "max_length": {
                            "type": "integer",
                            "description": "Maximum length of summary",
                            "default": 100
                        }
                    },
                    "required": ["text"]
                }
            )
        ]


class AnalyzerAgent(BaseAgent):
    """
    Example agent that analyzes data without using LLMs.
    
    Demonstrates a pure Python agent implementation.
    """
    
    def __init__(self):
        super().__init__()
        self.analysis_count = 0
    
    @property
    def name(self) -> str:
        """Agent identifier."""
        return "analyzer"
    
    def process(self, input_data: Any) -> TaskPacket:
        """
        Analyze input data and return statistics.
        
        Args:
            input_data: Data to analyze (string or dict)
        
        Returns:
            TaskPacket with analysis results
        """
        self.analysis_count += 1
        
        analysis = {
            "analysis_id": self.analysis_count,
            "input_type": type(input_data).__name__,
        }
        
        # Perform different analysis based on input type
        if isinstance(input_data, str):
            analysis.update({
                "length": len(input_data),
                "word_count": len(input_data.split()),
                "char_count": len(input_data),
                "has_numbers": any(c.isdigit() for c in input_data),
                "has_special_chars": any(not c.isalnum() and not c.isspace() for c in input_data)
            })
        elif isinstance(input_data, dict):
            analysis.update({
                "key_count": len(input_data.keys()),
                "keys": list(input_data.keys()),
                "nested": any(isinstance(v, (dict, list)) for v in input_data.values())
            })
        elif isinstance(input_data, list):
            analysis.update({
                "item_count": len(input_data),
                "types": list(set(type(item).__name__ for item in input_data))
            })
        
        return self.create_response(
            data=analysis,
            metadata={
                "agent_type": "analyzer",
                "total_analyses": self.analysis_count
            }
        )
    
    def get_tools(self) -> List[AgentTool]:
        """
        Define tools available to this agent.
        
        Returns:
            List of AgentTool definitions
        """
        return [
            AgentTool(
                name="analyze_text",
                description="Analyze text and return statistics",
                parameters={
                    "type": "object",
                    "properties": {
                        "text": {
                            "type": "string",
                            "description": "Text to analyze"
                        }
                    },
                    "required": ["text"]
                }
            ),
            AgentTool(
                name="analyze_structure",
                description="Analyze data structure (dict, list, etc.)",
                parameters={
                    "type": "object",
                    "properties": {
                        "data": {
                            "description": "Data structure to analyze"
                        }
                    },
                    "required": ["data"]
                }
            )
        ]
