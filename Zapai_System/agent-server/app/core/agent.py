import os
from typing import Dict, Any, Optional
from typing import List
from sqlmodel import Session
from app.db import engine
from app.models import AgentConfig, InteractionLog
from openai import OpenAI
from app.settings import get_settings
from app.schemas.response import AgentResponse, Action
from app.tools.registry import registry

class Agent:
    def __init__(self, agent_id: Optional[int] = None):
        self.settings = get_settings()
        self.client = OpenAI(api_key=self.settings.OPENAI_API_KEY)
        self.agent_id = agent_id
        
        # Load agent config
        self.system_prompt = "You are a helpful assistant."
        self.rules_prompt = ""
        self.personality_prompt = ""
        
        if agent_id:
            with Session(engine) as session:
                agent_config = session.get(AgentConfig, agent_id)
                if agent_config:
                    self.system_prompt = agent_config.system_prompt
                    self.rules_prompt = agent_config.rules_prompt
                    self.personality_prompt = agent_config.personality_prompt

    def _build_messages(self, user_message: str, metadata: Dict[str, Any]) -> List[Dict[str, str]]:
        system_content = f"{self.system_prompt}\n\nRULES:\n{self.rules_prompt}\n\nPERSONALITY:\n{self.personality_prompt}"
        
        # Tools
        tools_desc = registry.list_tools()
        if tools_desc:
            system_content += f"\n\nAVAILABLE TOOLS:\n{tools_desc}"
            
        system_content += """
        
OUTPUT FORMAT:
You must respond with a valid JSON object strictly matching this schema:
{
  "reply": "The response text to be sent to the user",
  "action": {
    "type": "tool",
    "name": "tool_name",
    "params": { ... }
  } or null,
  "confidence": 0.0 to 1.0
}
"""
        return [
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_message}
        ]

    def process_message(self, message: str, context: Dict[str, Any]) -> AgentResponse:
        messages = self._build_messages(message, context)
        
        # Mock for keyless testing
        if not self.settings.OPENAI_API_KEY or "your_" in self.settings.OPENAI_API_KEY:
            response = AgentResponse(
                reply=f"ECHO (Mock): {message}",
                action=None,
                confidence=1.0
            )
            self._log_interaction(message, response, context.get("lead_id", "unknown"))
            return response
        
        try:
            llm_response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            content = llm_response.choices[0].message.content
            response = AgentResponse.model_validate_json(content)
            
            self._log_interaction(message, response, context.get("lead_id", "unknown"))
            return response

        except Exception as e:
            print(f"Error calling LLM: {e}")
            # Fallback
            error_response = AgentResponse(
                reply="Desculpe, tive um problema técnico. Tente novamente mais tarde.",
                action=None,
                confidence=0.0
            )
            self._log_interaction(message, error_response, context.get("lead_id", "unknown"), error=str(e))
            return error_response

    def _log_interaction(self, message_in: str, response: AgentResponse, lead_id: str, error: Optional[str] = None):
        try:
            with Session(engine) as session:
                log = InteractionLog(
                    lead_id=lead_id,
                    agent_id=self.agent_id,
                    message_in=message_in,
                    message_out=response.reply,
                    tool_used=response.action.name if response.action else None,
                    confidence=response.confidence,
                    error=error
                )
                session.add(log)
                session.commit()
                print(f"DEBUG: Logged interaction for lead {lead_id}")
        except Exception as e:
            print(f"Failed to log interaction: {e}")


# Global agent instance
agent = Agent()
