import psycopg2
import os

# Using the connection string from previous context or env
# User provided: 
POSTGRES_URI = "postgresql://postgres:JHvxqYbyByvQgDGk@db.ypzpbsilumodjwjsdoth.supabase.co:5432/postgres"

def inspect_constraints():
    print(f"Connecting to database to inspect constraints...")
    try:
        conn = psycopg2.connect(POSTGRES_URI)
        cur = conn.cursor()
        
        # Query to get constraint details
        query = """
        SELECT
            tc.constraint_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='agent_configs';
        """
        
        cur.execute(query)
        rows = cur.fetchall()
        
        print("\n--- FOREIGN KEYS ON agent_configs ---")
        if not rows:
            print("No Foreign Keys found on agent_configs.")
        for row in rows:
            print(f"Constraint: {row[0]}")
            print(f"  Column: {row[1]}")
            print(f"  References: {row[2]}.{row[3]}")
            print("---")
            
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_constraints()
