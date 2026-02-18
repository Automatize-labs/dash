import psycopg2
import os

POSTGRES_URI = "postgresql://postgres:JHvxqYbyByvQgDGk@db.ypzpbsilumodjwjsdoth.supabase.co:5432/postgres"

def fix_data_and_fk():
    print(f"Connecting to database...")
    try:
        conn = psycopg2.connect(POSTGRES_URI)
        conn.autocommit = True
        cur = conn.cursor()
        print("Connected successfully.")
        
        # 1. Update Data (UUID -> Slug)
        print("updating agent_configs.client_id from UUID to Slug...")
        # Join with clients table to get the slug (clients.client_id) matching the UUID (agent_configs.client_id)
        # agent_configs.client_id is currently holding the UUID string
        sql_update = """
        UPDATE agent_configs ac
        SET client_id = c.client_id
        FROM clients c
        WHERE ac.client_id = c.id::text;
        """
        cur.execute(sql_update)
        print(f"Updated {cur.rowcount} rows.")
        
        # 2. Ensure clients.client_id is UNIQUE (needed for FK)
        print("Ensuring clients.client_id is UNIQUE...")
        try:
            cur.execute("ALTER TABLE clients ADD CONSTRAINT clients_client_id_key UNIQUE (client_id);")
            print("Added UNIQUE constraint to clients.client_id.")
        except Exception as e:
            print(f"Constraint might already exist: {e}")

        # 3. Restore FK (Slug -> Slug)
        print("Restoring FK: agent_configs.client_id -> clients.client_id...")
        try:
            cur.execute("""
            ALTER TABLE agent_configs
            ADD CONSTRAINT fk_agent_configs_clients
            FOREIGN KEY (client_id)
            REFERENCES clients(client_id)
            ON DELETE CASCADE;
            """)
            print("FK restored successfully.")
        except Exception as e:
            print(f"Error adding FK: {e}")

        cur.close()
        conn.close()
        print("Done.")
        
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    fix_data_and_fk()
