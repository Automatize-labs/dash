
import psycopg2
from psycopg2.extras import RealDictCursor

POSTGRES_URI = "postgresql://postgres:JHvxqYbyByvQgDGk@db.ypzpbsilumodjwjsdoth.supabase.co:5432/postgres"

def debug_schema():
    print("Connecting to DB...")
    conn = psycopg2.connect(POSTGRES_URI, cursor_factory=RealDictCursor)
    cur = conn.cursor()
    
    print("Querying information_schema.columns for 'agent_configs'...")
    cur.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'agent_configs'
        ORDER BY column_name;
    """)
    rows = cur.fetchall()
    
    cur.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'clients'
        ORDER BY column_name;
    """)
    client_rows = cur.fetchall()
    
    with open("schema_dump.txt", "w") as f:
        f.write(f"--- agent_configs ({len(rows)} columns) ---\n")
        for row in rows:
            default_val = row['column_default']
            if default_val is None: default_val = "NULL"
            f.write(f"[{row['column_name']}] Type: {row['data_type']}, Nullable: {row['is_nullable']}, Default: {default_val}\n")
            
        f.write(f"\n--- clients ({len(client_rows)} columns) ---\n")
        for row in client_rows:
            default_val = row['column_default']
            if default_val is None: default_val = "NULL"
            f.write(f"[{row['column_name']}] Type: {row['data_type']}, Nullable: {row['is_nullable']}, Default: {default_val}\n")

    cur.execute("""
        SELECT event_object_table, trigger_name, event_manipulation, action_statement, action_timing
        FROM information_schema.triggers
        WHERE event_object_table = 'agent_configs';
    """)
    triggers = cur.fetchall()
    
    with open("schema_dump.txt", "a") as f:
        f.write(f"\n--- TRIGGERS ({len(triggers)}) ---\n")
        for t in triggers:
            f.write(f"{t['trigger_name']} ({t['action_timing']} {t['event_manipulation']}): {t['action_statement']}\n")
            
    # Check other tables for client_id
    tables = ['knowledge_base', 'messages', 'leads', 'token_usage', 'agent_learnings']
    for table in tables:
        cur.execute(f"""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '{table}' AND column_name = 'client_id';
        """)
        rows = cur.fetchall()
        with open("schema_dump.txt", "a") as f:
            f.write(f"\n--- {table} client_id ---\n")
            for row in rows:
                f.write(f"[{row['column_name']}] Type: {row['data_type']}\n")

    print("Schema dumped to schema_dump.txt")
        
    conn.close()

if __name__ == "__main__":
    debug_schema()
