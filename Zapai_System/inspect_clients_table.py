import psycopg2
import os

POSTGRES_URI = "postgresql://postgres:JHvxqYbyByvQgDGk@db.ypzpbsilumodjwjsdoth.supabase.co:5432/postgres"

def inspect_clients():
    print(f"Connecting to database...")
    try:
        conn = psycopg2.connect(POSTGRES_URI)
        cur = conn.cursor()
        
        # Get columns
        print("\n--- Columns in 'clients' ---")
        cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clients';")
        for row in cur.fetchall():
            print(f"{row[0]}: {row[1]}")

        # Get constraints (PK/Unique)
        print("\n--- Constraints on 'clients' ---")
        query = """
        SELECT tc.constraint_name, tc.constraint_type, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'clients';
        """
        cur.execute(query)
        for row in cur.fetchall():
            print(f"{row[0]} ({row[1]}): {row[2]}")

        # Check agent_configs FK again
        print("\n--- FKs on 'agent_configs' ---")
        query_fk = """
        SELECT
            tc.constraint_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='agent_configs';
        """
        cur.execute(query_fk)
        for row in cur.fetchall():
            print(f"{row[0]}: {row[1]} -> {row[2]}.{row[3]}")

        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_clients()
