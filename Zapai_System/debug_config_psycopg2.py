
import psycopg2

# URI from add_supabase_cols.py
POSTGRES_URI = "postgresql://postgres:JHvxqYbyByvQgDGk@db.ypzpbsilumodjwjsdoth.supabase.co:5432/postgres"

def check_configs():
    print("Connecting to DB via psycopg2...")
    try:
        conn = psycopg2.connect(POSTGRES_URI)
        cur = conn.cursor()
        
        print("Querying agent_configs...")
        cur.execute("SELECT client_id, supabase_url, supabase_service_role_key FROM agent_configs;")
        rows = cur.fetchall()
        
        print(f"Found {len(rows)} configs.")
        for row in rows:
            c_id, s_url, s_key = row
            print(f"Client UUID: {c_id}")
            print(f"  Supabase URL: {s_url}")
            print(f"  Supabase Key: {'SKIPPING' if not s_key else s_key[:10] + '...'}")
            
            # Get text id from clients table
            try:
                cur.execute("SELECT client_id FROM clients WHERE id = %s", (c_id,))
                client_row = cur.fetchone()
                if client_row:
                    print(f"  Mapped to Client Name: {client_row[0]}")
            except Exception as e:
                print(f"  Mapping error: {e}")
            print("-" * 30)
            
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_configs()
