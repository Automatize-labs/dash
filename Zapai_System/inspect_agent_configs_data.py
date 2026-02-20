import psycopg2
import os
import json

# Direct Connection parameters (Port 5432)
POSTGRES_URI = "postgresql://postgres:JHvxqYbyByvQgDGk@db.ypzpbsilumodjwjsdoth.supabase.co:5432/postgres"

def inspect_data():
    print(f"Connecting to database...")
    try:
        conn = psycopg2.connect(POSTGRES_URI)
        cur = conn.cursor()
        print("Connected successfully.")
        
        # 1. Inspect 'clients' table structure
        print("\n--- Inspecting 'clients' table ---")
        try:
            cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clients';")
            cols = cur.fetchall()
            for col in cols:
                print(f" - {col[0]} ({col[1]})")
                
            print("\n--- Listing rows in 'clients' ---")
            cur.execute("SELECT * FROM clients LIMIT 5;")
            client_rows = cur.fetchall()
            for row in client_rows:
                print(row)
        except Exception as e:
            print(f"Error checking clients: {e}")

        # 2. List ALL agent_configs
        print("\n--- Listing ALL agent_configs ---")
        cur.execute("SELECT id, client_id, created_at FROM agent_configs;")
        rows = cur.fetchall()
        print(f"Found {len(rows)} configs total.")
        for row in rows:
            print(f" - ID: {row[0]}, Client: {row[1]}, Created: {row[2]}")
            
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    inspect_data()
