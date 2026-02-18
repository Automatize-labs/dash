import psycopg2
import os

# Direct Connection parameters (Port 5432)
POSTGRES_URI = "postgresql://postgres:JHvxqYbyByvQgDGk@db.ypzpbsilumodjwjsdoth.supabase.co:5432/postgres"

def run_migration():
    print(f"Connecting to database (Direct - Port 5432)...")
    try:
        conn = psycopg2.connect(POSTGRES_URI)
        conn.autocommit = True
        cur = conn.cursor()
        print("Connected successfully.")
        
        commands = [
            # Add columns
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_id TEXT NOT NULL DEFAULT 'default';",
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS client_id TEXT DEFAULT 'default';", # User asked for TEXT, then UPDATE. I'll use DEFAULT 'default' to make it easier.
            "ALTER TABLE token_usage ADD COLUMN IF NOT EXISTS client_id TEXT DEFAULT 'default';",
            "ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS client_id TEXT DEFAULT 'default';",
            "ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS client_id TEXT NOT NULL DEFAULT 'default';",

            # Update existing rows (if any) - redundant if I used DEFAULT, but good since I didn't use NOT NULL for some
            "UPDATE messages SET client_id = 'default' WHERE client_id IS NULL;",
            "UPDATE token_usage SET client_id = 'default' WHERE client_id IS NULL;",
            "UPDATE follow_ups SET client_id = 'default' WHERE client_id IS NULL;",

            # Create Indexes
            "CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);",
            "CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id);",
            "CREATE INDEX IF NOT EXISTS idx_knowledge_client_id ON knowledge_base(client_id);"
        ]
        
        for i, cmd in enumerate(commands):
            try:
                print(f"Executing: {cmd}")
                cur.execute(cmd)
            except Exception as e:
                print(f"Error executing command {i+1}: {e}")

        print("\n--- VALIDATION ---")
        cur.execute("SELECT table_name, column_name FROM information_schema.columns WHERE column_name = 'client_id';")
        rows = cur.fetchall()
        print(f"Tables with client_id: {[row[0] for row in rows]}")
        
        cur.close()
        conn.close()
        print("Schema update finished.")
        
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    run_migration()
