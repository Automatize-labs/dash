from src.database import SupabaseClient
import json

# Credentials from check_supabase.py
URL = "https://ypzpbsilumodjwjsdoth.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwenBic2lsdW1vZGp3anNkb3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkyNjk3NywiZXhwIjoyMDg2NTAyOTc3fQ.x6_i6X0om4omGE-wxJrn6kjBJL0JTBi4AuP-kI1-XSA"

def inspect():
    db = SupabaseClient(URL, KEY)
    
    # Check table info (simulated by selecting one row)
    try:
        print("--- checking agent_configs schema ---")
        res = db.client.table("agent_configs").select("*").limit(1).execute()
        if res.data:
            print("Columns:", res.data[0].keys())
            print("Sample Row:", json.dumps(res.data[0], indent=2))
        else:
            print("Table exists but is empty.")
            
        print("\n--- checking clients ---")
        res_clients = db.client.table("clients").select("*").execute()
        print(f"Clients found: {len(res_clients.data)}")
        for c in res_clients.data:
             print(f"- {c['name']} (ID: {c['client_id']})")
             
    except Exception as e:
        print(f"Error inspecting DB: {e}")

if __name__ == "__main__":
    inspect()
