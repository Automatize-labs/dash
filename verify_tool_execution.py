import asyncio
import os
from src.database import SupabaseClient
from src.orchestrator import Orchestrator

# Credentials
URL = "https://ypzpbsilumodjwjsdoth.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwenBic2lsdW1vZGp3anNkb3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkyNjk3NywiZXhwIjoyMDg2NTAyOTc3fQ.x6_i6X0om4omGE-wxJrn6kjBJL0JTBi4AuP-kI1-XSA"

async def test_tool():
    print("Initializing Orchestrator...")
    db = SupabaseClient(URL, KEY)
    orchestrator = Orchestrator(db)
    
    client_id = "flor" # As seen in inspect_db
    phone = "5511999999999" # Test phone
    
    # Message that should trigger the availability tool
    # The tool params are DIA_INICIO, MES_INICIO, etc.
    # The agent needs to infer these from natural language.
    # "Quero ver disponibilidade para 2 adultos e 1 criança de 20/12/2024 a 25/12/2024"
    message = "Olá, gostaria de verificar a disponibilidade para o período de 20/05/2025 a 25/05/2025 para 2 adultos e 1 criança."
    
    print(f"\nSending Message: '{message}'")
    print(f"Client: {client_id}")
    
    try:
        # We need an OpenAI Key. The config might have it, or we need to supply if missing.
        # inspect_db showed agent_config has openai_api_key in columns, hopefully it's set.
        # If not, we might need to inject one or fail.
        # Let's try without injecting first (relying on DB).
        
        result = await orchestrator.execute_agent(
            client_id=client_id,
            lead_phone=phone,
            message=message,
            lead_name="Tester"
        )
        
        print("\n--- Result ---")
        if result['success']:
            print(f"Type: {result.get('type')}")
            if result.get('type') == 'message':
                print(f"Response: {result.get('response')}")
            elif result.get('type') == 'tool_call':
                print("Tool Call triggered (Wait, internal execution should handle dynamic tools too?)")
                print("If this returns tool_call type, it means it thinks it's EXTERNAL.")
                # We modified is_internal_tool to return TRUE for dynamic tools.
                # So it should be executed internally by AgentEngine and return 'message'.
                print(f"Tool: {result.get('tool_name')}")
                print(f"Params: {result.get('tool_params')}")
        else:
            print(f"Error: {result.get('error')}")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_tool())
