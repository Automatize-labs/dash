import psycopg2
import os

# Connection parameters
POSTGRES_URI = "postgresql://postgres.ypzpbsilumodjwjsdoth:JHvxqYbyByvQgDGk@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

def run_migration():
    print("Connecting to database...")
    try:
        conn = psycopg2.connect(POSTGRES_URI)
        conn.autocommit = True
        cur = conn.cursor()
        print("Connected successfully.")
        
        # Read schema file
        with open("supabase_schema.sql", "r", encoding="utf-8") as f:
            schema_sql = f.read()

        # Split commands by semicolon to execute individually
        # This is a simple split, might need refinement if SQL contains semicolons in strings, 
        # but for this schema it should be fine.
        commands = [cmd.strip() for cmd in schema_sql.split(';') if cmd.strip()]
        
        print(f"Found {len(commands)} SQL commands to execute.")
        
        errors = []
        success_count = 0
        
        for i, cmd in enumerate(commands):
            try:
                # Skip empty commands
                if not cmd: continue
                
                print(f"Executing command {i+1}...")
                cur.execute(cmd)
                success_count += 1
            except Exception as e:
                # Ignore "already exists" errors for idempotency
                if "already exists" in str(e) or "skipping" in str(e):
                    print(f"Note on command {i+1}: {e}")
                    success_count += 1 # Count as success for idempotence
                else:
                    print(f"Error on command {i+1}: {e}")
                    errors.append((i+1, str(e)))
        
        print("-" * 30)
        print(f"Execution finished. Success: {success_count}, Errors: {len(errors)}")

        # Validation Steps
        print("\n--- VALIDATION ---")
        
        # 1. Validate Tables
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        tables = [row[0] for row in cur.fetchall()]
        print(f"Tables found: {tables}")
        
        expected_tables = ['follow_ups', 'knowledge_base', 'leads', 'messages', 'token_usage']
        missing_tables = [t for t in expected_tables if t not in tables]
        
        if missing_tables:
            print(f"❌ Missing tables: {missing_tables}")
        else:
            print("✅ All expected tables present.")

        # 2. Validate Extensions
        cur.execute("SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgvector', 'vector');")
        extensions = [row[0] for row in cur.fetchall()]
        print(f"Extensions found: {extensions}")
        
        if 'uuid-ossp' in extensions and ('pgvector' in extensions or 'vector' in extensions):
             print("✅ Extensions valid.")
        else:
             print("⚠️ Check extensions.")

        # 3. Validate Function
        cur.execute("""
            SELECT routine_name 
            FROM information_schema.routines 
            WHERE routine_name = 'search_knowledge_base';
        """)
        funcs = [row[0] for row in cur.fetchall()]
        if 'search_knowledge_base' in funcs:
            print("✅ Function 'search_knowledge_base' exists.")
        else:
            print("❌ Function 'search_knowledge_base' MISSING.")

        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    run_migration()
