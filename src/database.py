import os
import asyncio
from typing import List, Dict, Optional, Any
from supabase import create_client, Client, ClientOptions
from datetime import datetime

class SupabaseClient:
    def __init__(self, url: str, key: str):
        # Allow dynamic initialization
        self.client: Client = create_client(url, key)

    async def get_client_uuid(self, text_client_id: str) -> Optional[str]:
        """
        Resolves the text-based client_id (e.g. 'pousada') to the UUID id from clients table.
        NOTE: This must ALWAYS run against the ADMIN database, because 'clients' table is central.
        """
        try:
            # We assume self.client IS the admin client when this is called, 
            # OR we need a way to force admin client. 
            # Actually, `orchestrator.py` should handle this. 
            # This method might be called on the Dynamic Client if I'm not careful.
            # But 'clients' table is likely only in the Admin DB? 
            # Yes, 'clients' and 'agent_configs' are central.
            # 'messages', 'leads', 'token_usage', 'knowledge_base' are per-tenant.
            
            res = self.client.table("clients").select("id").eq("client_id", text_client_id).single().execute()
            if res.data:
                return res.data['id']
            return None
        except Exception as e:
            print(f"Error resolving client UUID: {e}")
            return None

    def sanitize_phone(self, phone: str) -> str:
        """
        Removes all non-numeric characters from the phone number.
        """
        return "".join(filter(str.isdigit, phone))

    async def get_or_create_lead(self, client_id: str, phone: str, name: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieves a lead by phone and client_id, or creates if not exists.
        """
        try:
            # Sanitize phone number to prevent duplicates
            clean_phone = self.sanitize_phone(phone)
            
            # Check if lead exists
            res = self.client.table("leads").select("*").eq("client_id", client_id).eq("phone", clean_phone).execute()
            if res.data:
                return res.data[0]
            
            # Create new lead
            new_lead = {
                "client_id": client_id,
                "phone": clean_phone,
                "name": name,
                "status": "active"
            }
            res = self.client.table("leads").insert(new_lead).execute()
            if res.data:
                return res.data[0]
            return None
        except Exception as e:
            print(f"Error in get_or_create_lead: {e}")
            raise e

    async def save_message(self, client_id: str, lead_id: str, content: str, role: str, tokens: int = 0) -> Dict[str, Any]:
        """
        Saves a message to the history.
        """
        try:
            message_data = {
                "client_id": client_id,
                "lead_id": lead_id,
                "content": content,
                "role": role,
                "tokens_used": tokens
            }
            res = self.client.table("messages").insert(message_data).execute()
            if res.data:
                return res.data[0]
            return None
        except Exception as e:
            print(f"Error in save_message: {e}")
            raise e

    async def get_conversation_history(self, client_id: str, lead_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Retrieves recent conversation history for a lead.
        """
        try:
            res = self.client.table("messages")\
                .select("*")\
                .eq("client_id", client_id)\
                .eq("lead_id", lead_id)\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            
            return res.data[::-1] if res.data else []
        except Exception as e:
            print(f"Error in get_conversation_history: {e}")
            raise e

    async def log_token_usage(self, client_id: str, lead_id: str, model: str, tokens_in: int, tokens_out: int, cost: float = 0.0) -> Dict[str, Any]:
        try:
            usage_data = {
                "client_id": client_id,
                "lead_id": lead_id,
                "model": model,
                "tokens_in": tokens_in,
                "tokens_out": tokens_out,
                "cost": cost
            }
            res = self.client.table("token_usage").insert(usage_data).execute()
            if res.data:
                return res.data[0]
            return None
        except Exception as e:
            print(f"Error in log_token_usage: {e}")
            return None
