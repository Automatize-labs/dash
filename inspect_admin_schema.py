from supabase import create_client, Client

url = "https://ypzpbsilumodjwjsdoth.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwenBic2lsdW1vZGp3anNkb3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkyNjk3NywiZXhwIjoyMDg2NTAyOTc3fQ.x6_i6X0om4omGE-wxJrn6kjBJL0JTBi4AuP-kI1-XSA"

def inspect_schema():
    print("Connecting to Admin Supabase...")
    try:
        supabase: Client = create_client(url, key)
        
        # 1. Try to select 1 row
        print("Selecting 1 row from token_usage...")
        res = supabase.table("token_usage").select("*").limit(1).execute()
        if res.data:
            print(f"Row found using SELECT *: {res.data[0]}")
            print(f"Keys: {list(res.data[0].keys())}")
        else:
            print("Table empty.")
            
        # 2. Try to select explicit client_id
        # print("Selecting client_id...")
        # try:
        #     res = supabase.table("token_usage").select("client_id").limit(1).execute()
        #     print("client_id column EXISTS.")
        # except Exception as e:
        #     print(f"client_id column ERROR: {e}")

        # 6. Check agent_configs columns
        print("Checking agent_configs columns...")
        config_cols = ['client_id', 'id', 'user_id', 'supabase_url', 'supabase_service_role_key']
        for col in config_cols:
             try:
                supabase.table("agent_configs").select(col).limit(1).execute()
                print(f"agent_configs '{col}' column EXISTS.")
             except Exception as e:
                print(f"agent_configs '{col}' column MISSING: {e}")

            
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    inspect_schema()
