
import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor

# Use the direct connection String
POSTGRES_URI = "postgresql://postgres:JHvxqYbyByvQgDGk@db.ypzpbsilumodjwjsdoth.supabase.co:5432/postgres"

def verify_tools_persistence():
    print("Connecting to DB...")
    conn = psycopg2.connect(POSTGRES_URI, cursor_factory=RealDictCursor)
    conn.autocommit = True
    cur = conn.cursor()

    import uuid
    client_id = str(uuid.uuid4())
    print(f"Generated Client UUID: {client_id}")
    
    # 1. Define a tool payload (as if coming from Frontend)
    tools_payload = [
        {
            "name": "check_stock",
            "description": "Check product stock",
            "parameters": json.dumps({
                "type": "object",
                "properties": {
                    "product_id": {"type": "string"}
                }
            })
        },
        {
            "name": "calculate_shipping",
            "description": "Calc shipping cost",
            "parameters": json.dumps({
                "type": "object",
                "properties": {
                    "zip_code": {"type": "string"}
                }
            })
        }
    ]
    
    # Simulate Frontend Logic: Parameters are ALREADY objects when sent to Supabase
    processed_tools = []
    for t in tools_payload:
        processed_tools.append({
            "name": t["name"],
            "description": t["description"],
            "parameters": json.loads(t["parameters"]) # Frontend does this parse
        })
    
    print(f"Upserting config for client: {client_id}")
    
    encoded_tools = json.dumps(processed_tools) 
    
    try:
        # Ensure Client Exists
        cur.execute("""
            INSERT INTO clients (id, name)
            VALUES (%s, 'Test Tools Client')
            ON CONFLICT (id) DO NOTHING;
        """, (client_id,))
        
        # Minimal Insert with Hardcoded Values and ID to rule out everything
        print("Attempting explicit insert with formatting...")
        import uuid
        new_id = str(uuid.uuid4())
        insert_query = f"INSERT INTO agent_configs (id, client_id, system_prompt, enabled_tools) VALUES ('{new_id}', '{client_id}', 'test base prompt', '[]')"
        print(f"Executing: {insert_query}")
        cur.execute(insert_query)
        print("Explicit insert successful.")
        
        # Now Update with Tools
        print("Updating with tools...")
        cur.execute("""
            UPDATE agent_configs
            SET enabled_tools = %s, updated_at = NOW()
            WHERE client_id = %s
        """, (encoded_tools, client_id))
        print("Update successful.")
        
        cur.execute("SELECT enabled_tools FROM agent_configs WHERE client_id = %s", (client_id,))
        row = cur.fetchone()
        
        if not row:
            print("❌ Row not found after insert!")
            return

        saved_tools = row['enabled_tools']
        
        print(f"Read back type: {type(saved_tools)}")
        if isinstance(saved_tools, list) and len(saved_tools) == 2:
            print("✅ Success! Tools saved as List (JSONB).")
            # ... checks ...
        else:
            print(f"❌ Failed. Content: {saved_tools}")
            
    except psycopg2.Error as e:
        print(f"❌ Database Error: {e.pgerror}")
        print(f"Code: {e.pgcode}")
        if e.diag:
            print(f"Message Primary: {e.diag.message_primary}")
            print(f"Message Detail: {e.diag.message_detail}")
            print(f"Column Name: {e.diag.column_name}")
            print(f"Constraint Name: {e.diag.constraint_name}")
    except Exception as e:
        print(f"❌ General Error: {e}")
        
    finally:
        # Clean up
        try:
            cur.execute("DELETE FROM agent_configs WHERE client_id = %s", (client_id,))
            print("Cleanup done.")
        except:
            pass
        conn.close()

if __name__ == "__main__":
    verify_tools_persistence()
