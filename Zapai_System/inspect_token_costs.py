import psycopg2
import os

# Direct Connection parameters (Port 5432)
POSTGRES_URI = "postgresql://postgres:JHvxqYbyByvQgDGk@db.ypzpbsilumodjwjsdoth.supabase.co:5432/postgres"

def inspect_costs():
    print(f"Connecting to database...")
    try:
        conn = psycopg2.connect(POSTGRES_URI)
        cur = conn.cursor()
        print("Connected successfully.")
        
        # 1. Check columns of token_usage
        print("\n--- Inspecting 'token_usage' columns ---")
        cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'token_usage';")
        cols = cur.fetchall()
        for col in cols:
            print(f" - {col[0]} ({col[1]})")

        # 2. Insert Test Row
        print("\n--- Inserting Test Row ---")
        try:
             cur.execute("""
                INSERT INTO token_usage (lead_id, model, tokens_in, tokens_out, cost, client_id)
                VALUES (NULL, 'gpt-4o-mini', 100, 50, 0.000045, 'kairy');
             """)
             print("Test row inserted.")
        except Exception as e:
            print(f"Error inserting row: {e}")

        # 3. Check for rows again
        print("\n--- Rows in 'token_usage' (Limit 10) ---")
        try:
             cur.execute("SELECT id, tokens_in, tokens_out, cost, client_id FROM token_usage WHERE client_id = 'kairy' ORDER BY created_at DESC LIMIT 10;")
             rows = cur.fetchall()
             for row in rows:
                 # row: id, in, out, cost, client_id
                 print(f"ID: {row[0]} | In: {row[1]} | Out: {row[2]} | Cost: {row[3]} | Client: {row[4]}")
        except Exception as e:
            print(f"Error fetching rows: {e}")

        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    inspect_costs()
