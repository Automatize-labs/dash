
import requests
import json
import sys

# Replace with the actual URL from deployment output
# Since we don't know the URL yet, we will prompt or look for it.
# For now, I will use a placeholder and expect to replace it or pass it as arg.
BASE_URL = "https://sabris-agente-serv-whatsapp.modal.run" # Approximate, will need verification.

def test_endpoints(base_url):
    print(f"Testing endpoints at {base_url}...")
    
    # 1. Health
    try:
        res = requests.get(f"{base_url}/health")
        print(f"GET /health: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"GET /health FAILED: {e}")

    # 2. Save Message
    save_payload = {
        "client_id": "test_client",
        "phone": "5511999998888",
        "message": "Hello from test script!",
        "role": "user"
    }
    try:
        res = requests.post(f"{base_url}/test/save", json=save_payload)
        print(f"POST /test/save: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"POST /test/save FAILED: {e}")

    # 3. Get History
    get_payload = {
        "client_id": "test_client",
        "phone": "5511999998888",
        "limit": 5
    }
    try:
        res = requests.post(f"{base_url}/test/get", json=get_payload)
        print(f"POST /test/get: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"POST /test/get FAILED: {e}")

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else BASE_URL
    test_endpoints(url)
