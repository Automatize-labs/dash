import asyncio
import aiohttp
import json
from supabase import create_client

# Configuration
SUPABASE_URL = "https://ypzpbsilumodjwjsdoth.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwenBic2lsdW1vZGp3anNkb3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkyNjk3NywiZXhwIjoyMDg2NTAyOTc3fQ.x6_i6X0om4omGE-wxJrn6kjBJL0JTBi4AuP-kI1-XSA"
MODAL_URL = "https://equipeautomatize--agente-serv-whatsapp-fastapi-app.modal.run/webhook/execute"

async def main():
    # 1. Setup DB Client
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    client_id = "test_client"
    
    # 2. Configure Agent with JSON Tool
    tool_def = {
        "name": "check_availability",
        "description": "Verifica disponibilidade de quartos",
        "parameters": {
            "type": "object",
            "properties": {
                "checkin": {"type": "string", "description": "Data de entrada"},
                "checkout": {"type": "string", "description": "Data de saída"},
                "adultos": {"type": "integer", "description": "Número de adultos"}
            },
            "required": ["checkin", "checkout"]
        }
    }
    
    config = {
        "client_id": client_id,
        "system_prompt": "Você é um recepcionista de hotel. Use a tool check_availability para verificar quartos.",
        "model": "gpt-4o-mini",
        "enabled_tools": [tool_def],
        "active": True
    }
    
    print(f"Upserting config for {client_id}...")
    try:
        # Check if exists
        res = supabase.table("agent_configs").select("*").eq("client_id", client_id).execute()
        if res.data:
            # Update
            supabase.table("agent_configs").update({
                "enabled_tools": [tool_def],
                "active": True,
                "model": "gpt-4o-mini",
                "system_prompt": "Você é um recepcionista de hotel. Use a tool check_availability para verificar quartos."
            }).eq("client_id", client_id).execute()
            print("Config updated.")
        else:
            # Insert
            supabase.table("agent_configs").insert(config).execute()
            print("Config inserted.")
            
    except Exception as e:
        print(f"Error saving config: {e}")
        return

    # 3. Trigger Webhook
    payload = {
        "client_id": client_id,
        "lead_phone": "5511999998888",
        "message": "Quero verificar disponibilidade para 2 adultos de 10 a 15 de dezembro"
    }
    
    print(f"Sending request to {MODAL_URL}...")
    async with aiohttp.ClientSession() as session:
        async with session.post(MODAL_URL, json=payload) as resp:
            if resp.status != 200:
                print(f"Error: {resp.status} - {await resp.text()}")
                return
            
            result = await resp.json()
            print("\n--- API Response ---")
            print(json.dumps(result, indent=2))
            
            # 4. Assertions
            if result.get("type") == "tool_call" and result.get("tool_name") == "check_availability":
                params = result.get("tool_params")
                if "10" in params.get("checkin", "") or "10" in params.get("checkin", ""): # Loose check
                     print("\n✅ SUCCESS: Tool call returned correctly!")
                else:
                     print("\n⚠️ PARTIAL SUCCESS: Tool called but params look weird.")
            else:
                print("\n❌ FAILURE: Did not receive tool_call response.")

if __name__ == "__main__":
    asyncio.run(main())
