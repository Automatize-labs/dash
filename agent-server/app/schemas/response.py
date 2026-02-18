from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal

class Action(BaseModel):
    type: Literal["tool"] = "tool"
    name: str
    params: Dict[str, Any] = Field(default_factory=dict)

class AgentResponse(BaseModel):
    reply: str
    action: Optional[Action] = None
    confidence: float = Field(..., ge=0.0, le=1.0)
