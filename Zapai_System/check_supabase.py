
import os
from supabase import create_client, Client

url = "https://ypzpbsilumodjwjsdoth.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwenBic2lsdW1vZGp3anNkb3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkyNjk3NywiZXhwIjoyMDg2NTAyOTc3fQ.x6_i6X0om4omGE-wxJrn6kjBJL0JTBi4AuP-kI1-XSA"

try:
    supabase: Client = create_client(url, key)
    # Perform a simple query to verify connection (e.g., list buckets or similar if available, or just check auth)
    # Since we can't easily list tables via postgrest if RLS is on and tables are empty, let's just check if we can instantiate and maybe list buckets if storage is enabled, or just succeed.
    print("Supabase client initialized successfully.")
    
    # Inspect agent_configs table
    try:
        response = supabase.table("agent_configs").select("*").limit(1).execute()
        if response.data and len(response.data) > 0:
            print("Agent Configs columns:")
            for key in response.data[0].keys():
                print(f"- {key}")
        else:
            print("Agent Configs table is empty or error.")
    except Exception as e:
        print(f"Error querying agent_configs: {e}")


except Exception as e:
    print(f"Failed to connect to Supabase: {e}")
