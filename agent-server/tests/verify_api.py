import requests
import json
import time
import sys

def test_agent():
    url = "http://localhost:8000/agent/message"
    payload = {
        "lead_id": "test_user_123",
        "message": "Olá, tudo bem?",
        "channel": "whatsapp",
        "metadata": {"source": "test_script"}
    }

    print(f"Testing {url}...")
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        print("Success!")
        print(json.dumps(data, indent=2))
    except requests.exceptions.ConnectionError:
        print("Failed to connect. Is the server running?")
        sys.exit(1)
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Wait for server to start
    time.sleep(2)
    test_agent()
