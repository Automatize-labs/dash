
import psycopg2

POSTGRES_URI = "postgresql://postgres:JHvxqYbyByvQgDGk@db.ypzpbsilumodjwjsdoth.supabase.co:5432/postgres"

def add_columns():
    print("Connecting to database...")
    try:
        conn = psycopg2.connect(POSTGRES_URI)
        conn.autocommit = True
        cur = conn.cursor()
        print("Connected.")

        commands = [
            "ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS supabase_url TEXT;",
            "ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS supabase_service_role_key TEXT;"
        ]

        for cmd in commands:
            print(f"Executing: {cmd}")
            cur.execute(cmd)
            print("Success.")

        cur.close()
        conn.close()
        print("Migration complete.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_columns()
