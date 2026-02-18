
import os
from supabase import create_client, Client

url = "https://ypzpbsilumodjwjsdoth.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwenBic2lsdW1vZGp3anNkb3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkyNjk3NywiZXhwIjoyMDg2NTAyOTc3fQ.x6_i6X0om4omGE-wxJrn6kjBJL0JTBi4AuP-kI1-XSA"

try:
    print(f"Connecting to Admin Supabase: {url}")
    supabase: Client = create_client(url, key)
    
    print("Fetching ALL agent_configs...")
    # Fetch all configs
    response = supabase.table("agent_configs").select("client_id, supabase_url, supabase_service_role_key").execute()
    
    if response.data:
        print(f"Found {len(response.data)} configs.")
        for config in response.data:
            c_id = config.get('client_id')
            s_url = config.get('supabase_url')
            s_key = config.get('supabase_service_role_key')
            
            # Since client_id is a UUID here, let's try to resolve it to name if possible, or just print it.
            # actually let's fetch clients table too to map names
            
            print(f"Config UUID: {c_id}")
            print(f"  Supabase URL: {s_url}")
            print(f"  Supabase Key: {'SKIPPING' if not s_key else s_key[:10] + '...'}")
            print("-" * 30)
            
            # check if this is the target isolated db
            if s_url and "hemyrujbttlcojcbzfcn" in s_url:
                print(f"Connecting to ISOLATED DB: {s_url}")
                try:
                    iso_client = create_client(s_url, s_key)
                    # Inspect columns of token_usage
                    print("Checking 'token_usage' columns in Isolated DB...")
                    # We can't easily list columns via client-js style, but we can try to select 1 row
                    res = iso_client.table("token_usage").select("*").limit(1).execute()
                    if res.data:
                        print("Columns found based on first row keys:")
                        print(res.data[0].keys())
                    else:
                        print("Table 'token_usage' is empty, cannot infer columns from data.")
                        # Try to insert a dummy to see if it fails? No, risky.
                        # Just try to select 'estimated_cost' specifically
                        try:
                            iso_client.table("token_usage").select("estimated_cost").limit(1).execute()
                            print("Column 'estimated_cost' EXISTS.")
                        except Exception as e:
                            print(f"Column 'estimated_cost' MISSING: {e}")

                        try:
                            iso_client.table("token_usage").select("cost").limit(1).execute()
                            print("Column 'cost' EXISTS.")
                        except Exception as e:
                            print(f"Column 'cost' MISSING: {e}")

                except Exception as e:
                    print(f"Failed to connect to isolated DB: {e}")

    else:
        print("No configs found in agent_configs table.")

except Exception as e:
    print(f"Error: {e}")
