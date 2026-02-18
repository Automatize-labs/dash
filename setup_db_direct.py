import psycopg2
import os

# Direct Connection parameters (Port 5432)
# User: postgres
# Pass: JHvxqYbyByvQgDGk
# Host: db.ypzpbsilumodjwjsdoth.supabase.co
# DB: postgres
POSTGRES_URI = "postgresql://postgres:JHvxqYbyByvQgDGk@db.ypzpbsilumodjwjsdoth.supabase.co:5432/postgres"

def run_migration():
    print(f"Connecting to database (Direct - Port 5432)...")
    try:
        conn = psycopg2.connect(POSTGRES_URI)
        conn.autocommit = True
        cur = conn.cursor()
        print("Connected successfully.")
        
        # Read schema file
        with open("supabase_schema.sql", "r", encoding="utf-8") as f:
            schema_sql = f.read()

        # Split commands by semicolon
        # Refined split to avoid splitting inside valid blocks if possible, 
        # but for this specific schema, it is simple enough.
        # However, to be safer with function bodies (wait, the function body uses $$...$$ but ends with ;),
        # simple split might break the function if it has internal semicolons.
        # The provided schema has a PL/PGSQL function. We need to be careful.
        # Let's try to read the whole file and execute specific blocks or just the whole thing if the driver supports it.
        # psycopg2.cursor.execute() can execute multiple statements if provided as a single string.
        # Let's try executing the whole file first, which is atomic-ish.
        # If that fails, we split. 
        # The user instruction asked to "Treat each command SQL separately (split by ';')".
        # I must follow instructions, but the function body complicates it.
        # I will do a smarter split or just try to execute the function block together.
        
        # Let's use the file content and try to split carefully.
        # OR: Just run the whole script in one go? 
        # User said: "Trate cada comando SQL separadamente (split por ';')"
        # I will stick to that but I need to handle the function.
        # The function ends with `$$;`. 
        
        commands = []
        current_command = []
        in_dollar_quote = False
        
        # Basic parser for ; splitter respecting $$ quotes
        # This is a bit risky to implement from scratch in one go, but let's try a simpler approach:
        # The schema provided is well formatted.
        
        # Let's stick to the previous split logic but verify if 'search_knowledge_base' is created.
        # If the simple split breaks the function, we'll see an error.
        # The function body:
        # BEGIN
        #    RETURN QUERY
        #    SELECT ...
        #    FROM ...
        #    WHERE ...
        #    ORDER BY ...
        #    LIMIT ...;   <-- Internal semicolon!
        # END;
        # $$;
        
        # The simple split will break on `LIMIT match_count;`.
        # I will execute the function creation as a single logical block if I can identify it.
        # Or, I can just execute the whole file. 
        # "Trate cada comando SQL separadamente" - I should try to honor this.
        # I'll manually separate the function for this script since I know the content.
        
        # We can read the file and manually chunk it since we know the content.
        
        print("Executing commands...")
        
        # 1. Extensions
        cur.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        try:
            cur.execute('CREATE EXTENSION IF NOT EXISTS "vector";')
            print("Extension 'vector' created.")
        except Exception as e:
            print(f"Failed to create 'vector', trying 'pgvector': {e}")
            cur.execute('rollback;') # Rollback just in case
            cur.execute('CREATE EXTENSION IF NOT EXISTS "pgvector";')
        
        # 2. Tables
        tables_sql = [
            """CREATE TABLE IF NOT EXISTS leads (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                phone TEXT UNIQUE NOT NULL,
                name TEXT,
                status TEXT DEFAULT 'active',
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );""",
            """CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
                tokens_used INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            );""",
            """CREATE TABLE IF NOT EXISTS token_usage (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
                model TEXT NOT NULL,
                tokens_in INTEGER NOT NULL,
                tokens_out INTEGER NOT NULL,
                cost DECIMAL(10, 6) DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            );""",
            """CREATE TABLE IF NOT EXISTS follow_ups (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                scheduled_for TIMESTAMP NOT NULL,
                status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
                created_at TIMESTAMP DEFAULT NOW(),
                sent_at TIMESTAMP
            );""",
            """CREATE TABLE IF NOT EXISTS knowledge_base (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title TEXT,
                content TEXT NOT NULL,
                metadata JSONB DEFAULT '{}',
                embedding VECTOR(1536),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );"""
        ]
        
        for i, sql in enumerate(tables_sql):
            try:
                cur.execute(sql)
                print(f"Table {i+1} handled.")
            except Exception as e:
                print(f"Table {i+1} error: {e}")

        # 3. Indexes
        indexes_sql = [
            "CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);",
            "CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);",
            "CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);",
            "CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled ON follow_ups(scheduled_for) WHERE status = 'pending';",
            "CREATE INDEX IF NOT EXISTS idx_token_usage_lead_id ON token_usage(lead_id);",
            "CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);"
        ]
        
        for i, sql in enumerate(indexes_sql):
            try:
                cur.execute(sql)
                print(f"Index {i+1} handled.")
            except Exception as e:
                print(f"Index {i+1} error: {e}")

        # 4. Function
        func_sql = """
        CREATE OR REPLACE FUNCTION search_knowledge_base(
            query_embedding VECTOR(1536),
            match_threshold FLOAT DEFAULT 0.7,
            match_count INT DEFAULT 5
        )
        RETURNS TABLE (
            id UUID,
            title TEXT,
            content TEXT,
            metadata JSONB,
            similarity FLOAT
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
            RETURN QUERY
            SELECT
                kb.id,
                kb.title,
                kb.content,
                kb.metadata,
                1 - (kb.embedding <=> query_embedding) AS similarity
            FROM knowledge_base kb
            WHERE 1 - (kb.embedding <=> query_embedding) > match_threshold
            ORDER BY kb.embedding <=> query_embedding
            LIMIT match_count;
        END;
        $$;
        """
        try:
            cur.execute(func_sql)
            print("Function created.")
        except Exception as e:
            print(f"Function error: {e}")
            
        print("-" * 30)
        print("Execution finished.")

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

        # Create Agent Learnings Table
        try:
            with open('create_learnings_table.sql', 'r') as f:
                sql = f.read()
                cur.execute(sql)
                conn.commit()
                print("Agent Learnings table created successfully.")
        except Exception as e:
            print(f"Error creating learnings table: {e}")
            conn.rollback()

        # Update Agent Configs Table
        try:
            with open('update_agent_configs.sql', 'r') as f:
                sql = f.read()
                cur.execute(sql)
                conn.commit()
                print("Agent Configs table updated successfully.")
        except Exception as e:
            print(f"Error updating agent configs: {e}")
            conn.rollback()

        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    run_migration()
