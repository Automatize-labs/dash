import modal
from modal import App, Image, Secret, asgi_app

# Define image with dependencies AND add local directory
image = modal.Image.debian_slim().pip_install(
    "fastapi",
    "pydantic",
    "supabase",
    "psycopg2-binary",
    "python-dateutil",
    "openai",
    "tiktoken"
).add_local_dir("src", remote_path="/root/src")


app = modal.App("agente-serv-whatsapp")

# Persistent Dict for storing conversation context waiting for tools
agent_contexts = modal.Dict.from_name("agent_contexts", create_if_missing=True)

@app.function(
    image=image,
    secrets=[
        modal.Secret.from_name("supabase-secrets")
    ]
)
@modal.asgi_app()
def fastapi_app():
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel
    from typing import Optional, Dict, Any
    import os
    
    # Imports from src must be inside to work with the mount
    from src.orchestrator import Orchestrator
    from src.database import SupabaseClient
    from src import tools # Import tools module if we want to use it
    
    api = FastAPI()

    class WebhookRequest(BaseModel):
        client_id: str
        lead_phone: str
        message: str
        lead_name: Optional[str] = None
        openai_api_key: Optional[str] = None

    class ToolResultRequest(BaseModel):
        context_id: str
        client_id: str
        lead_phone: str
        tool_name: str
        tool_result: Dict[str, Any]

    class SaveMessageRequest(BaseModel):
        client_id: str = "default"
        phone: str
        message: str
        role: str

    class GetHistoryRequest(BaseModel):
        client_id: str = "default"
        phone: str
        limit: int = 10

    @api.get("/health")
    async def health():
        return {"status": "healthy"}

    @api.post("/webhook/execute")
    async def webhook_execute(req: WebhookRequest):
        try:
            url = os.environ["SUPABASE_URL"]
            key = os.environ["SUPABASE_SERVICE_KEY"]
            import uuid
            
            db_client = SupabaseClient(url, key)
            orchestrator = Orchestrator(db_client)
            
            result = await orchestrator.execute_agent(
                client_id=req.client_id,
                lead_phone=req.lead_phone,
                message=req.message,
                lead_name=req.lead_name,
                openai_api_key=req.openai_api_key
            )
            
            if result.get("success") and result.get("type") == "tool_call":
                # Generate Context ID
                context_id = str(uuid.uuid4())
                
                # Store Context in Modal Dict
                context_data = {
                    "client_id": req.client_id,
                    "lead_phone": req.lead_phone,
                    "messages": result.get("messages"),
                    "tool_call_id": result.get("tool_call_id"),
                    "tool_name": result.get("tool_name")
                }
                agent_contexts[context_id] = context_data
                
                return {
                    "success": True,
                    "type": "tool_call",
                    "tool_name": result.get("tool_name"),
                    "tool_params": result.get("tool_params"),
                    "context_id": context_id,
                    "message": "Aguardando execução de tool externa..."
                }

            return result
        except Exception as e:
            # Capture full traceback or detail
            import traceback
            trace = traceback.format_exc()
            print(f"WEBHOOK ERROR: {trace}")
            return {
                "success": False, 
                "error": str(e), 
                "error_details": trace,
                "error_type": "internal_error"
            }

    @api.post("/webhook/tool-result")
    async def tool_result(req: ToolResultRequest):
        try:
            # Retrieve Context
            context_data = agent_contexts.get(req.context_id)
            if not context_data:
                return {"success": False, "error": "Context not found or expired"}
            
            # Validate ownership
            if context_data['client_id'] != req.client_id or context_data['lead_phone'] != req.lead_phone:
                return {"success": False, "error": "Context mismatch"}

            url = os.environ["SUPABASE_URL"]
            key = os.environ["SUPABASE_SERVICE_KEY"]
            
            db_client = SupabaseClient(url, key)
            orchestrator = Orchestrator(db_client)
            
            # Resume Execution
            result = await orchestrator.resume_agent(
                client_id=req.client_id,
                lead_phone=req.lead_phone,
                messages=context_data['messages'],
                tool_call_id=context_data['tool_call_id'],
                tool_name=req.tool_name,
                tool_result=req.tool_result
            )
            
            # Clean up context if successful final message
            if result.get("success") and result.get("type") == "message":
                try:
                    agent_contexts.pop(req.context_id)
                except:
                    pass

            return result

        except Exception as e:
            return {"success": False, "error": str(e), "error_type": "internal_error"}

    @api.post("/test/save")
    async def test_save(req: SaveMessageRequest):
        try:
            url = os.environ["SUPABASE_URL"]
            key = os.environ["SUPABASE_SERVICE_KEY"]
            db = SupabaseClient(url, key)
            
            lead = await db.get_or_create_lead(req.client_id, req.phone)
            if not lead:
                 return {"success": False, "error": "Failed to get lead"}
            
            msg = await db.save_message(req.client_id, lead['id'], req.message, req.role)
            return {"success": True, "message_id": msg['id'], "lead_id": lead['id']} if msg else {"success": False}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @api.post("/test/get")
    async def test_get(req: GetHistoryRequest):
        try:
            url = os.environ["SUPABASE_URL"]
            key = os.environ["SUPABASE_SERVICE_KEY"]
            db = SupabaseClient(url, key)
            
            lead = await db.get_or_create_lead(req.client_id, req.phone)
            if not lead:
                 return {"success": False, "error": "Lead not found"}
            
            messages = await db.get_conversation_history(req.client_id, lead['id'], req.limit)
            return {"success": True, "messages": messages, "lead_id": lead['id']}
        except Exception as e:
            return {"success": False, "error": str(e)}

    return api
