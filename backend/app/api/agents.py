from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from pydantic import BaseModel
from app.core.agent_base import TaskPacket, AgentTool
from app.services.example_agents import SimpleAssistantAgent, AnalyzerAgent

router = APIRouter()

# Agent registry - in production, this would be more sophisticated
AGENTS = {
    "assistant_fast": SimpleAssistantAgent(model_type="fast"),
    "assistant_reasoning": SimpleAssistantAgent(model_type="reasoning"),
    "analyzer": AnalyzerAgent()
}


class ProcessRequest(BaseModel):
    """Request model for processing data with an agent."""
    agent_name: str
    data: Any
    metadata: Dict[str, Any] = {}


class ProcessResponse(BaseModel):
    """Response model for agent processing."""
    packet: Dict[str, Any]
    agent_name: str
    status: str


@router.get("/list")
async def list_agents():
    """
    List all available agents.
    
    Returns:
        Dictionary of agent names and their status
    """
    return {
        "agents": [
            {
                "name": agent.name,
                "status": agent.status.value,
                "type": agent.__class__.__name__
            }
            for agent in AGENTS.values()
        ],
        "count": len(AGENTS)
    }


@router.get("/{agent_name}/tools")
async def get_agent_tools(agent_name: str):
    """
    Get tools available for a specific agent.
    
    Args:
        agent_name: Name of the agent
    
    Returns:
        List of tools with their definitions
    """
    if agent_name not in AGENTS:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found")
    
    agent = AGENTS[agent_name]
    tools = agent.get_tools()
    
    return {
        "agent": agent_name,
        "tools": [
            {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.parameters
            }
            for tool in tools
        ],
        "count": len(tools)
    }


@router.post("/process")
async def process_with_agent(request: ProcessRequest):
    """
    Process data with a specific agent.
    
    Args:
        request: ProcessRequest containing agent_name, data, and metadata
    
    Returns:
        TaskPacket response from the agent
    """
    if request.agent_name not in AGENTS:
        raise HTTPException(
            status_code=404,
            detail=f"Agent '{request.agent_name}' not found. Available: {list(AGENTS.keys())}"
        )
    
    agent = AGENTS[request.agent_name]
    
    try:
        # Create input packet
        input_packet = TaskPacket(
            source_agent="api",
            target_agent=request.agent_name,
            data=request.data,
            metadata=request.metadata
        )
        
        # Process with agent
        response_packet = agent.handle_packet(input_packet)
        
        return ProcessResponse(
            packet=response_packet.to_dict(),
            agent_name=agent.name,
            status="success"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing with agent: {str(e)}"
        )


@router.post("/communicate")
async def agent_to_agent_communication(
    source_agent: str,
    target_agent: str,
    data: Any,
    metadata: Dict[str, Any] = {}
):
    """
    Facilitate communication between two agents.
    
    Args:
        source_agent: Name of the sending agent
        target_agent: Name of the receiving agent
        data: Data to send
        metadata: Optional metadata
    
    Returns:
        Response from the target agent
    """
    if source_agent not in AGENTS:
        raise HTTPException(status_code=404, detail=f"Source agent '{source_agent}' not found")
    
    if target_agent not in AGENTS:
        raise HTTPException(status_code=404, detail=f"Target agent '{target_agent}' not found")
    
    try:
        # Create packet from source agent
        packet = TaskPacket(
            source_agent=source_agent,
            target_agent=target_agent,
            data=data,
            metadata=metadata
        )
        
        # Process with target agent
        target = AGENTS[target_agent]
        response = target.handle_packet(packet)
        
        return {
            "source": source_agent,
            "target": target_agent,
            "response": response.to_dict()
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error in agent communication: {str(e)}"
        )


@router.get("/{agent_name}/history")
async def get_agent_history(agent_name: str):
    """
    Get conversation history for a specific agent.
    
    Args:
        agent_name: Name of the agent
    
    Returns:
        List of TaskPackets in the agent's history
    """
    if agent_name not in AGENTS:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found")
    
    agent = AGENTS[agent_name]
    history = agent.get_conversation_history()
    
    return {
        "agent": agent_name,
        "history": [packet.to_dict() for packet in history],
        "count": len(history)
    }


@router.delete("/{agent_name}/history")
async def clear_agent_history(agent_name: str):
    """
    Clear conversation history for a specific agent.
    
    Args:
        agent_name: Name of the agent
    
    Returns:
        Confirmation message
    """
    if agent_name not in AGENTS:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found")
    
    agent = AGENTS[agent_name]
    agent.clear_history()
    
    return {
        "agent": agent_name,
        "message": "History cleared successfully"
    }
