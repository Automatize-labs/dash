
import asyncio
import os
from src.database import SupabaseClient
from src.orchestrator import Orchestrator
from dotenv import load_dotenv

load_dotenv(dotenv_path=r"C:\Users\sabri\PROJETOS ANTIGRAVY\zapai-dashboard\.env.local")

async def test_slug_loading():
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("Missing Supabase credentials in .env.local")
        return

    print(f"Connecting to Supabase: {url}")
    db = SupabaseClient(url, key)
    orchestrator = Orchestrator(db)

    client_id = "kairy" # Exists in DB
    print(f"\n--- Testing load_agent_config('{client_id}') ---")
    
    config = await orchestrator.load_agent_config(client_id)
    
    if config:
        print("✅ Config loaded successfully!")
        print(f"  - Model: {config.get('model')}")
        print(f"  - System Prompt: {config.get('system_prompt')[:50]}...")
    else:
        print("❌ Config NOT found.")

if __name__ == "__main__":
    asyncio.run(test_slug_loading())
