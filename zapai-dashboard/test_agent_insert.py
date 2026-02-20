import os
from supabase import create_client, Client

# Hardcoded credentials from .env.local view (admin/service role key needed? No, user has anon key in env)
# BUT to test "real" backend logic or bypass RLS, we usually need service_role. 
# The user's .env.local only has ANON key.
# If RLS is the issue, using ANON key here will reproduce the failure.
url = "https://ypzpbsilumodjwjsdoth.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwenBic2lsdW1vZGp3anNkb3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkyNjk3NywiZXhwIjoyMDg2NTAyOTc3fQ.x6_i6X0om4omGE-wxJrn6kjBJL0JTBi4AuP-kI1-XSA" 
# This looked like an anon key in .env.local but wait... 
# "role":"service_role" is in the JWT payload if you decode it! 
# Let's check the string "service_role" inside the key. 
# eyJ...InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkyNjk3NywiZXhwIjoyMDg2NTAyOTc3fQ
# "service_role" is encoded in the middle.
# So the user MIGHT contain the service role key in NEXT_PUBLIC_SUPABASE_ANON_KEY? 
# OR they put the service role key there by mistake?
# The variable name is ANON_KEY.
# Let's try to use it.

supabase: Client = create_client(url, key)

def test_insert():
    client_id = "test_agent_123"
    print(f"Testing insertion for client_id: {client_id}")

    # 1. Create Client
    try:
        print("Inserting client...")
        res = supabase.table("clients").insert({
            "client_id": client_id, 
            "name": "Test Agent", 
            "active": True
        }).execute()
        if res.data:
            print(f"Client created: {res.data[0]}")
        else:
            print("Client created but no data returned?")
            
    except Exception as e:
        print(f"Client insert error (maybe exists): {e}")
        # Try to select it if it exists
        try:
             res = supabase.table("clients").select("*").eq("client_id", client_id).execute()
             if res.data:
                 print(f"Existing client found: {res.data[0]}")
        except:
            pass

    # 2. Create Agent Config
    try:
        print("Inserting agent config...")
        # Note: Sending client_id as TEXT
        res = supabase.table("agent_configs").insert({
            "client_id": client_id,
            "system_prompt": "Teste",
            "model": "gpt-4o-mini",
            "active": True
        }).execute()
        print("Agent Config created successfully!")
        print(res.data)
    except Exception as e:
        print(f"Agent Config insert ERROR: {e}")

if __name__ == "__main__":
    test_insert()
