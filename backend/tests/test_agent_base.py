"""
Test suite for agent base class and TaskPacket messaging system.
"""
import pytest
from datetime import datetime
from app.core.agent_base import BaseAgent, TaskPacket, AgentTool, AgentStatus
from app.services.example_agents import SimpleAssistantAgent, AnalyzerAgent


class TestTaskPacket:
    """Test TaskPacket functionality."""
    
    def test_create_task_packet(self):
        """Test basic TaskPacket creation."""
        packet = TaskPacket(
            source_agent="test_agent",
            data={"message": "Hello, World!"},
            metadata={"priority": "high"}
        )
        
        assert packet.source_agent == "test_agent"
        assert packet.data == {"message": "Hello, World!"}
        assert packet.metadata["priority"] == "high"
        assert isinstance(packet.timestamp, datetime)
    
    def test_task_packet_serialization(self):
        """Test TaskPacket JSON serialization."""
        packet = TaskPacket(
            source_agent="agent1",
            target_agent="agent2",
            data={"test": "data"}
        )
        
        # Serialize to JSON
        json_str = packet.to_json()
        assert isinstance(json_str, str)
        assert "agent1" in json_str
        
        # Deserialize from JSON
        restored = TaskPacket.from_json(json_str)
        assert restored.source_agent == packet.source_agent
        assert restored.target_agent == packet.target_agent
        assert restored.data == packet.data
    
    def test_task_packet_dict_conversion(self):
        """Test TaskPacket dictionary conversion."""
        packet = TaskPacket(
            source_agent="test",
            data=[1, 2, 3]
        )
        
        # Convert to dict
        packet_dict = packet.to_dict()
        assert isinstance(packet_dict, dict)
        assert packet_dict["source_agent"] == "test"
        
        # Create from dict
        restored = TaskPacket.from_dict(packet_dict)
        assert restored.source_agent == packet.source_agent
        assert restored.data == packet.data


class TestAgentTool:
    """Test AgentTool functionality."""
    
    def test_create_agent_tool(self):
        """Test AgentTool creation."""
        tool = AgentTool(
            name="test_tool",
            description="A test tool",
            parameters={
                "type": "object",
                "properties": {
                    "param1": {"type": "string"}
                }
            }
        )
        
        assert tool.name == "test_tool"
        assert tool.description == "A test tool"
        assert "param1" in tool.parameters["properties"]


class TestBaseAgent:
    """Test BaseAgent abstract class."""
    
    def test_cannot_instantiate_base_agent(self):
        """Test that BaseAgent cannot be instantiated directly."""
        with pytest.raises(TypeError):
            BaseAgent()
    
    def test_concrete_agent_implementation(self):
        """Test that concrete agents can be instantiated."""
        agent = AnalyzerAgent()
        
        assert agent.name == "analyzer"
        assert agent.status == AgentStatus.IDLE
        assert isinstance(agent.get_tools(), list)
    
    def test_agent_process_method(self):
        """Test agent processing."""
        agent = AnalyzerAgent()
        
        result = agent.process("Hello, World!")
        
        assert isinstance(result, TaskPacket)
        assert result.source_agent == "analyzer"
        assert "length" in result.data
        assert result.data["length"] == 13
    
    def test_create_response_helper(self):
        """Test the create_response helper method."""
        agent = AnalyzerAgent()
        
        response = agent.create_response(
            data={"result": "success"},
            target_agent="other_agent",
            metadata={"key": "value"}
        )
        
        assert isinstance(response, TaskPacket)
        assert response.source_agent == "analyzer"
        assert response.target_agent == "other_agent"
        assert response.data == {"result": "success"}
        assert response.metadata["key"] == "value"
    
    def test_handle_packet(self):
        """Test packet handling with conversation history."""
        agent = AnalyzerAgent()
        
        input_packet = TaskPacket(
            source_agent="sender",
            data="test data",
            metadata={"conversation_id": "conv123"}
        )
        
        response = agent.handle_packet(input_packet)
        
        assert isinstance(response, TaskPacket)
        assert response.source_agent == "analyzer"
        assert response.target_agent == "sender"
        assert response.metadata.get("conversation_id") == "conv123"
        
        # Check conversation history
        history = agent.get_conversation_history()
        assert len(history) == 1
        assert history[0] == input_packet
    
    def test_conversation_history(self):
        """Test conversation history management."""
        agent = AnalyzerAgent()
        
        # Process multiple packets
        for i in range(3):
            packet = TaskPacket(
                source_agent=f"agent_{i}",
                data=f"message {i}"
            )
            agent.handle_packet(packet)
        
        history = agent.get_conversation_history()
        assert len(history) == 3
        
        # Clear history
        agent.clear_history()
        assert len(agent.get_conversation_history()) == 0
    
    def test_agent_tools(self):
        """Test agent tool discovery."""
        agent = AnalyzerAgent()
        tools = agent.get_tools()
        
        assert len(tools) > 0
        assert all(isinstance(tool, AgentTool) for tool in tools)
        assert any(tool.name == "analyze_text" for tool in tools)


class TestAgentCommunication:
    """Test inter-agent communication."""
    
    def test_agent_to_agent_communication(self):
        """Test communication between two agents."""
        analyzer = AnalyzerAgent()
        
        # Create a packet from one agent
        packet = TaskPacket(
            source_agent="external_agent",
            data="Test message for analysis",
            metadata={"request_id": "req123"}
        )
        
        # Process with analyzer
        response = analyzer.handle_packet(packet)
        
        assert response.source_agent == "analyzer"
        assert response.target_agent == "external_agent"
        assert "word_count" in response.data
    
    def test_multiple_agent_chain(self):
        """Test chaining multiple agents."""
        analyzer = AnalyzerAgent()
        
        # First agent processes
        packet1 = TaskPacket(
            source_agent="user",
            data="Hello world"
        )
        
        response1 = analyzer.handle_packet(packet1)
        
        # Second agent could process the first agent's response
        # (In a real scenario, this would be a different agent type)
        packet2 = TaskPacket(
            source_agent=response1.source_agent,
            data=response1.data
        )
        
        response2 = analyzer.handle_packet(packet2)
        
        assert response2.source_agent == "analyzer"
        assert len(analyzer.get_conversation_history()) == 2


class TestErrorHandling:
    """Test error handling in agents."""
    
    def test_agent_error_handling(self):
        """Test that agents handle errors gracefully."""
        agent = AnalyzerAgent()
        
        # Create a packet that might cause issues
        packet = TaskPacket(
            source_agent="test",
            data=None  # This should still be handled
        )
        
        response = agent.handle_packet(packet)
        
        # Agent should return a response even with None data
        assert isinstance(response, TaskPacket)
        assert response.source_agent == "analyzer"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
