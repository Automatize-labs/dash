import psycopg2
import os

# Direct Connection parameters (Port 5432)
POSTGRES_URI = "postgresql://postgres:JHvxqYbyByvQgDGk@db.ypzpbsilumodjwjsdoth.supabase.co:5432/postgres"

def fix_schema():
    print(f"Connecting to database to fix schema...")
    try:
        conn = psycopg2.connect(POSTGRES_URI)
        conn.autocommit = True
        cur = conn.cursor()
        print("Connected successfully.")
        
        # 1. Drop FK Constraint if exists
        print("Dropping FK constraint 'fk_client'...")
        try:
            # We don't know exact name, but user valid output suggests "fk_client"
            # Or try dropping any FK on client_id.
            cur.execute("ALTER TABLE agent_configs DROP CONSTRAINT IF EXISTS fk_client;")
            # Also drop any other likely names
            cur.execute("ALTER TABLE agent_configs DROP CONSTRAINT IF EXISTS agent_configs_client_id_fkey;")
            print("FK Constraints dropped.")
        except Exception as e:
            print(f"Error dropping constraint: {e}")

        # 2. Alter Column
        print("Altering agent_configs.client_id to TEXT...")
        try:
            cur.execute("ALTER TABLE agent_configs ALTER COLUMN client_id TYPE TEXT;")
            print("Successfully changed client_id to TEXT.")
        except Exception as e:
            print(f"Error altering column: {e}")
            
        cur.close()
        conn.close()
        print("Fix complete.")
        
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    fix_schema()
