from datetime import datetime
from typing import Optional, List, Dict
from sqlmodel import Field, SQLModel, JSON, Column

class AgentConfig(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: Optional[str] = None
    channel: str = Field(default="whatsapp")
    status: str = Field(default="active")  # active, paused
    model: str = Field(default="gpt-3.5-turbo")
    temperature: float = Field(default=0.7)
    
    # Relationships could be added here, but keeping it simple for now
    system_prompt: str = Field(default="")
    rules_prompt: str = Field(default="")
    personality_prompt: str = Field(default="")

class ToolConfig(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    description: str
    parameters: Dict = Field(default={}, sa_column=Column(JSON))
    is_active: bool = Field(default=True)

class InteractionLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    lead_id: str = Field(index=True)
    agent_id: Optional[int] = Field(default=None, foreign_key="agentconfig.id")
    message_in: str
    message_out: str
    tool_used: Optional[str] = None
    confidence: float
    error: Optional[str] = None
