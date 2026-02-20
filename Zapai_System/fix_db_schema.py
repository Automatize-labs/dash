
import psycopg2
from psycopg2.extras import RealDictCursor

POSTGRES_URI = "postgresql://postgres:JHvxqYbyByvQgDGk@db.ypzpbsilumodjwjsdoth.supabase.co:5432/postgres"

def fix_schema():
    print("Connecting to DB...")
    conn = psycopg2.connect(POSTGRES_URI, cursor_factory=RealDictCursor)
    conn.autocommit = True
    cur = conn.cursor()
    
    print("Dropping table agent_configs...")
    cur.execute("DROP TABLE IF EXISTS agent_configs CASCADE;")
    
    print("Recreating table agent_configs...")
    cur.execute("""
    CREATE TABLE agent_configs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        client_id UUID NOT NULL UNIQUE,
        system_prompt TEXT,
        model TEXT DEFAULT 'gpt-4o-mini',
        temperature FLOAT DEFAULT 0.7,
        max_tokens INTEGER DEFAULT 1000,
        openai_api_key TEXT,
        rag_enabled BOOLEAN DEFAULT TRUE,
        rag_top_k INTEGER DEFAULT 3,
        enabled_tools JSONB DEFAULT '[]'::jsonb,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    """)
    # Add foreign key if clients exists
    try:
        cur.execute("""
        ALTER TABLE agent_configs 
        ADD CONSTRAINT fk_client 
        FOREIGN KEY (client_id) 
        REFERENCES clients (id)
        ON DELETE CASCADE;
        """)
        print("Constraint fk_client added.")
    except Exception as e:
        print(f"Could not add FK (maybe clients table missing/type mismatch): {e}")

    print("Table agent_configs recreated successfully.")
    conn.close()

if __name__ == "__main__":
    fix_schema()
