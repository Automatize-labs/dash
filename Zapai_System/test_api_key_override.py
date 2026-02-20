
import requests
import json
import sys

# Default URL
BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "https://equipeautomatize--agente-serv-whatsapp-fastapi-app.modal.run"

CLIENT_ID = "test_client"
LEAD_PHONE = "5511999999999"

def test_api_key_override():
    print(f"🚀 Testing API Key Override on {BASE_URL}")

    # Use a FAKE key. If override works, this SHOULD fail with OpenAI error.
    # If override fails (and it falls back to DB key), this might succeed (if DB has valid key).
    fake_key = "sk-fake-key-1234567890"

    payload = {
        "client_id": CLIENT_ID,
        "lead_phone": LEAD_PHONE,
        "message": "Hello, are you there?",
        "lead_name": "Tester",
        "openai_api_key": fake_key 
    }
    
    print(f"🔹 Sending request with INVALID key: {fake_key}")
    
    try:
        resp = requests.post(f"{BASE_URL}/webhook/execute", json=payload, timeout=60)
        
        # We expect a 200 OK from our API, but the RESPONSE content should contain an error
        # OR our API might return 500/400? 
        # In orchestrator.py: 
        # if not success: return {"success": False, "error": ..., "error_type": "openai_error"}
        # So we expect a JSON response with success=False.

        if resp.status_code != 200:
             print(f"⚠️ API returned status {resp.status_code}. Response: {resp.text}")
        
        data = resp.json()
        print(f"Response: {json.dumps(data, indent=2)}")

        if data.get("success") is False:
             error_msg = data.get("error", "")
             if "Incorrect API key" in error_msg or "401" in str(error_msg) or "openai_error" in data.get("error_type", ""):
                 print("✅ Test Passed: API correctly used the invalid provided key and failed.")
             else:
                 print(f"⚠️ Test Inconclusive: Failed, but error message unexpected: {error_msg}")
        else:
             print("❌ Test Failed: Request succeeded! It likely ignored the provided key and used the stored one.")

    except Exception as e:
        print(f"❌ Test Error: {e}")

if __name__ == "__main__":
    test_api_key_override()
