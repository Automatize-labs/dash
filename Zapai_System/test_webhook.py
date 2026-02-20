
import requests
import json
import sys

# Replace with the actual URL from deployment output
BASE_URL = "https://equipeautomatize--agente-serv-whatsapp-fastapi-app.modal.run"

def test_webhook(base_url):
    print(f"Testing Webhook at {base_url}...")
    
    # 1. Test Valid Client (Expect OpenAI Error due to placeholder key)
    print("\n--- Test 1: Valid Client (test_client) ---")
    payload_1 = {
        "client_id": "test_client",
        "lead_phone": "5516999999999",
        "message": "Olá, qual o horário de atendimento?",
        "lead_name": "João Teste"
    }
    try:
        res = requests.post(f"{base_url}/webhook/execute", json=payload_1)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
        
        data = res.json()
        if not data['success'] and "openai" in str(data.get('error')).lower():
             print("✅ Passed: Correctly failed at OpenAI step (invalid key).")
        elif data['success']:
             print("❓ Unexpected Success (Did you put a real key?)")
        else:
             print(f"❌ Failed: Unexpected error: {data.get('error')}")

    except Exception as e:
        print(f"Request Failed: {e}")

    # 2. Test Invalid Client
    print("\n--- Test 2: Invalid Client ---")
    payload_2 = {
        "client_id": "invalid_client_123",
        "lead_phone": "5516999999999",
        "message": "Teste"
    }
    try:
        res = requests.post(f"{base_url}/webhook/execute", json=payload_2)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
        
        data = res.json()
        if not data['success'] and data.get('error_type') == "active_config_not_found":
             print("✅ Passed: Correctly identified invalid/inactive client.")
        else:
             print(f"❌ Failed: Unexpected response: {data}")

    except Exception as e:
        print(f"Request Failed: {e}")

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else BASE_URL
    test_webhook(url)
