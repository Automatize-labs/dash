
import requests
import json
import sys
import time

# Default URL, can be overridden by arg
BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "https://equipeautomatize--agente-serv-whatsapp-fastapi-app.modal.run"

CLIENT_ID = "test_client"
LEAD_PHONE = "5511999999999"

def print_step(msg):
    print(f"\n🔹 {msg}")

def test_hybrid_flow():
    print(f"🚀 Testing Hybrid Flow on {BASE_URL}")

    # Step 1: Trigger External Tool
    print_step("Step 1: Sending message to trigger 'check_property_availability'...")
    payload_1 = {
        "client_id": CLIENT_ID,
        "lead_phone": LEAD_PHONE,
        "message": "O imóvel ID 123 está disponível?",
        "lead_name": "Tester"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/webhook/execute", json=payload_1, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if data.get("type") == "tool_call" and data.get("tool_name") == "check_property_availability":
            print("✅ Step 1 Passed: Received tool_call for check_property_availability.")
        else:
            print("❌ Step 1 Failed: Did not receive expected tool_call.")
            return

        context_id = data.get("context_id")
        if not context_id:
            print("❌ Step 1 Failed: No context_id received.")
            return
            
    except Exception as e:
        print(f"❌ Step 1 Error: {e}")
        return

    # Step 2: Send Tool Result
    print_step("Step 2: Sending tool result (Simulating N8N)...")
    
    tool_result_payload = {
        "available": True,
        "price": 500000.00,
        "location": "São Paulo, SP"
    }
    
    payload_2 = {
        "context_id": context_id,
        "client_id": CLIENT_ID,
        "lead_phone": LEAD_PHONE,
        "tool_name": "check_property_availability",
        "tool_result": tool_result_payload
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/webhook/tool-result", json=payload_2, timeout=60)
        resp.raise_for_status()
        final_data = resp.json()
        print(f"Final Response: {json.dumps(final_data, indent=2)}")
        
        if final_data.get("type") == "message" and "500" in final_data.get("response", ""):
             print("✅ Step 2 Passed: Agent resumed and used tool result in answer.")
        else:
             print("⚠️ Step 2 Warning: Check response content. Expected message type and price mention.")
             
    except Exception as e:
        print(f"❌ Step 2 Error: {e}")

if __name__ == "__main__":
    test_hybrid_flow()
