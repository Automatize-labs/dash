from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal

class AgentRequest(BaseModel):
    lead_id: str = Field(..., description="Unique identifier for the user/lead")
    message: str = Field(..., description="The message content from the user")
    channel: Literal["whatsapp"] = Field("whatsapp", description="The communication channel")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional context")
