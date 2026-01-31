from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Callable
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class TaskPacket(BaseModel):
    """
    Standard message format for inter-agent communication.
    
    This Pydantic model ensures type-safe, validated message passing
    between different agent types (Python-based, LangChain-based, etc.).
    """
    
    source_agent: str = Field(
        ...,
        description="Identifier of the agent that created this packet"
    )
    
    target_agent: Optional[str] = Field(
        None,
        description="Identifier of the intended recipient agent (None for broadcast)"
    )
    
    data: Any = Field(
        ...,
        description="The actual payload/content of the message"
    )
    
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional context (priority, routing, conversation_id, etc.)"
    )
    
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="When this packet was created"
    )
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert TaskPacket to dictionary."""
        return self.model_dump()
    
    def to_json(self) -> str:
        """Serialize TaskPacket to JSON string."""
        return self.model_dump_json()
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "TaskPacket":
        """Create TaskPacket from dictionary."""
        return cls(**data)
    
    @classmethod
    def from_json(cls, json_str: str) -> "TaskPacket":
        """Deserialize TaskPacket from JSON string."""
        return cls.model_validate_json(json_str)


class AgentTool(BaseModel):
    """
    Definition of a tool that an agent can use.
    
    Tools enable agents to perform specific actions or access capabilities.
    """
    
    name: str = Field(
        ...,
        description="Unique identifier for the tool"
    )
    
    description: str = Field(
        ...,
        description="Human-readable description of what the tool does"
    )
    
    parameters: Dict[str, Any] = Field(
        default_factory=dict,
        description="JSON schema describing the tool's parameters"
    )
    
    function: Optional[Callable] = Field(
        None,
        description="The actual function to execute (optional, for runtime binding)",
        exclude=True  # Don't serialize the function
    )
    
    class Config:
        arbitrary_types_allowed = True


class AgentStatus(str, Enum):
    """Agent operational status."""
    IDLE = "idle"
    PROCESSING = "processing"
    ERROR = "error"
    STOPPED = "stopped"


class BaseAgent(ABC):
    """
    Abstract base class for all agents in the system.
    
    This class defines the standard interface that all agents must implement,
    enabling seamless multi-agent communication and interoperability.
    
    Concrete agents must implement:
    - name property: Unique identifier for the agent
    - process(): Core processing logic
    - get_tools(): List of available tools
    """
    
    def __init__(self):
        """Initialize the base agent."""
        self._status = AgentStatus.IDLE
        self._conversation_history: List[TaskPacket] = []
    
    @property
    @abstractmethod
    def name(self) -> str:
        """
        Unique identifier for this agent.
        
        Returns:
            Agent name/identifier
        """
        pass
    
    @property
    def status(self) -> AgentStatus:
        """Get current agent status."""
        return self._status
    
    @abstractmethod
    def process(self, input_data: Any) -> TaskPacket:
        """
        Process input data and return a TaskPacket response.
        
        This is the core method where the agent's logic resides.
        
        Args:
            input_data: Input to process (can be raw data or TaskPacket)
        
        Returns:
            TaskPacket containing the processing result
        """
        pass
    
    @abstractmethod
    def get_tools(self) -> List[AgentTool]:
        """
        Get list of tools this agent can use.
        
        Returns:
            List of AgentTool definitions
        """
        pass
    
    def initialize(self) -> None:
        """
        Optional initialization logic.
        
        Override this method if your agent needs setup before processing.
        """
        pass
    
    def cleanup(self) -> None:
        """
        Optional cleanup logic.
        
        Override this method if your agent needs teardown after processing.
        """
        pass
    
    def create_response(
        self,
        data: Any,
        target_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> TaskPacket:
        """
        Helper method to create a TaskPacket response.
        
        Args:
            data: Response data
            target_agent: Optional target agent identifier
            metadata: Optional metadata dictionary
        
        Returns:
            TaskPacket with this agent as source
        """
        return TaskPacket(
            source_agent=self.name,
            target_agent=target_agent,
            data=data,
            metadata=metadata or {}
        )
    
    def handle_packet(self, packet: TaskPacket) -> TaskPacket:
        """
        Process a TaskPacket and return a response.
        
        This method wraps the process() method and handles TaskPacket-specific logic.
        
        Args:
            packet: Input TaskPacket
        
        Returns:
            Response TaskPacket
        """
        # Add to conversation history
        self._conversation_history.append(packet)
        
        # Update status
        self._status = AgentStatus.PROCESSING
        
        try:
            # Process the packet's data
            response = self.process(packet.data)
            
            # Add conversation context to metadata
            if "conversation_id" in packet.metadata:
                response.metadata["conversation_id"] = packet.metadata["conversation_id"]
            
            # Set target as the source of the incoming packet
            if not response.target_agent:
                response.target_agent = packet.source_agent
            
            self._status = AgentStatus.IDLE
            return response
            
        except Exception as e:
            self._status = AgentStatus.ERROR
            return self.create_response(
                data={"error": str(e), "type": type(e).__name__},
                target_agent=packet.source_agent,
                metadata={"error": True, "original_packet": packet.to_dict()}
            )
    
    def get_conversation_history(self) -> List[TaskPacket]:
        """
        Get the agent's conversation history.
        
        Returns:
            List of TaskPackets in chronological order
        """
        return self._conversation_history.copy()
    
    def clear_history(self) -> None:
        """Clear the conversation history."""
        self._conversation_history.clear()
    
    def __repr__(self) -> str:
        """String representation of the agent."""
        return f"{self.__class__.__name__}(name='{self.name}', status='{self.status.value}')"
