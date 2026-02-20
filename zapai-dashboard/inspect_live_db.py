import psycopg2
import os

POSTGRES_URI = "postgresql://postgres:JHvxqYbyByvQgDGk@db.ypzpbsilumodjwjsdoth.supabase.co:5432/postgres"

def inspect_live_db():
    print(f"Connecting to live database...")
    try:
        conn = psycopg2.connect(POSTGRES_URI)
        cur = conn.cursor()
        
        # # 1. Check agent_configs columns and types
        # print("\n--- Columns in 'agent_configs' ---")
        # cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'agent_configs';")
        # for row in cur.fetchall():
        #     print(f"{row[0]}: {row[1]}")

        # # 2. Check clients columns and types
        # print("\n--- Columns in 'clients' ---")
        # cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clients';")
        # for row in cur.fetchall():
        #     print(f"{row[0]}: {row[1]}")

        # # 3. Check exact FK constraint definition
        # print("\n--- FK on 'agent_configs' ---")
        # query_fk = """
        # SELECT
        #     tc.constraint_name, 
        #     kcu.column_name AS local_column, 
        #     ccu.table_name AS foreign_table,
        #     ccu.column_name AS foreign_column 
        # FROM 
        #     information_schema.table_constraints AS tc 
        #     JOIN information_schema.key_column_usage AS kcu
        #       ON tc.constraint_name = kcu.constraint_name
        #     JOIN information_schema.constraint_column_usage AS ccu
        #       ON ccu.constraint_name = tc.constraint_name
        # WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='agent_configs';
        # """
        # cur.execute(query_fk)
        # rows = cur.fetchall()
        # if not rows:
        #     print("No FK found on agent_configs!!")
        # for row in rows:
        #     print(f"Constraint: {row[0]}")
        #     print(f"  {row[1]} -> {row[2]}.{row[3]}")

        # 4. Check data in clients to confirm specific ID exists
        cur.execute("SELECT client_id, name FROM clients;")
        rows = cur.fetchall()
        print(f"\nTotal clients: {len(rows)}")
        for row in rows:
            print(f"  - {row[0]} ({row[1]})")

        # # 5. Check knowledge_base columns
        # print("\n--- Columns in 'knowledge_base' ---")
        # try:
        #     cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'knowledge_base';")
        #     rows = cur.fetchall()
        #     if rows:
        #         for row in rows:
        #             print(f"{row[0]}: {row[1]}")
        #     else:
        #         print("Table 'knowledge_base' not found.")
        # except Exception as e:
        #     print(f"Error checking knowledge_base: {e}")

        # # 6. Check leads columns
        # print("\n--- Columns in 'leads' ---")
        # try:
        #     cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leads';")
        #     rows = cur.fetchall()
        #     for row in rows:
        #         print(f"{row[0]}: {row[1]}")
        # except Exception as e:
        #     print(f"Error checking leads: {e}")

        # 7. Check messages columns
        print("\n--- Columns in 'messages' ---")
        try:
            cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages';")
            rows = cur.fetchall()
            for row in rows:
                print(f"{row[0]}: {row[1]}")
        except Exception as e:
            print(f"Error checking messages: {e}")



        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_live_db()
