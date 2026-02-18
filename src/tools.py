import modal
from .database import SupabaseClient
import os

# Define dependencies
image = modal.Image.debian_slim().pip_install("fastapi", "pydantic", "supabase", "psycopg2-binary", "python-dateutil")
app = modal.App("agente-serv-whatsapp")

@app.function(image=image, secrets=[modal.Secret.from_name("supabase-secrets")])
async def get_conversation(client_id: str, phone: str, limit: int = 10):
    """
    Busca histórico de conversa.
    Se o lead não existir, retorna vazio ou erro, mas aqui vamos buscar pelo phone.
    """
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_KEY"]
    db = SupabaseClient(url, key)
    
    # Precisamos do lead_id. 
    # Se o lead não existe, não tem conversa.
    # Vamos verificar se o lead existe sem criar? 
    # Ou get_or_create? Para get history, se não existe, vazio.
    
    # Reusing logic from db client, but distinct: find lead first
    # We can create a lightweight method in db or just use get_or_create
    lead = await db.get_or_create_lead(client_id, phone)
    
    if not lead:
        return {"success": False, "error": "Lead creation failed"}
        
    messages = await db.get_conversation_history(client_id, lead['id'], limit)
    return {"success": True, "messages": messages, "lead_id": lead['id']}

@app.function(image=image, secrets=[modal.Secret.from_name("supabase-secrets")])
async def save_message(client_id: str, phone: str, content: str, role: str, tokens: int = 0):
    """
    Salva mensagem no histórico. Cria lead se necessário.
    """
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_KEY"]
    db = SupabaseClient(url, key)
    
    lead = await db.get_or_create_lead(client_id, phone)
    if not lead:
        return {"success": False, "error": "Failed to get lead"}
        
    msg = await db.save_message(client_id, lead['id'], content, role, tokens)
    if msg:
        return {"success": True, "message_id": msg['id'], "lead_id": lead['id']}
    else:
        return {"success": False, "error": "Failed to save message"}
