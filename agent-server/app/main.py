from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
from app.schemas.request import AgentRequest
from app.schemas.response import AgentResponse
from app.core.agent import Agent
from app.settings import get_settings
from app.db import create_db_and_tables
from app.routers import agents, tools, logs

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(title="Agent Server", version="1.1.0", lifespan=lifespan)
settings = get_settings()

app.include_router(agents.router)
app.include_router(tools.router)
app.include_router(logs.router)

@app.post("/agent/message", response_model=AgentResponse)
async def chat_endpoint(request: AgentRequest):
    """
    Process a message from the user (via n8n/WhatsApp) and return a response/action.
    """
    # Initialize agent with specific ID if provided, otherwise default
    # simplified to re-instantiate for each request to fetch latest config
    # In production, we'd use a cache or a more sophisticated loader
    current_agent = Agent(agent_id=request.metadata.get("agent_id"))
    
    # Ensure lead_id is available in context for logging
    context = request.metadata.copy()
    context["lead_id"] = request.lead_id
    
    try:
        response = current_agent.process_message(request.message, context)
        return response
    except Exception as e:
        # In a real app we'd log this and maybe return a fallback response
        # respecting the "never return empty" rule
        return AgentResponse(
            reply="Ocorreu um erro interno. Por favor, tente novamente.",
            confidence=0.0
        )

@app.get("/health")
def health_check():
    return {"status": "ok", "service": settings.SERVICE_NAME}
