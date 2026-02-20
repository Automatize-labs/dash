import requests
import json
import time
import sys

BASE_URL = "http://localhost:8001"

def test_management():
    print("1. Creating a new agent...")
    agent_payload = {
        "name": "Test Agent",
        "description": "Agent for testing management API",
        "system_prompt": "You are a helpful test assistant.",
        "model": "gpt-3.5-turbo"
    }
    try:
        response = requests.post(f"{BASE_URL}/agents/", json=agent_payload)
        response.raise_for_status()
        agent = response.json()
        agent_id = agent["id"]
        print(f"   Success! Agent ID: {agent_id}")
    except Exception as e:
        print(f"   Failed: {e}")
        return

    print("\n2. Sending message to the agent...")
    chat_payload = {
        "lead_id": "manager_test_user",
        "message": "Hello from test script",
        "channel": "whatsapp",
        "metadata": {"agent_id": agent_id}
    }
    try:
        response = requests.post(f"{BASE_URL}/agent/message", json=chat_payload)
        response.raise_for_status()
        print("   Success! Response received.")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"   Failed: {e}")
        return

    print("\n3. Verifying logs...")
    try:
        # Give a moment for async write if any (though currently synchronous)
        time.sleep(1)
        response = requests.get(f"{BASE_URL}/logs/?lead_id=manager_test_user")
        response.raise_for_status()
        logs = response.json()
        if logs:
            print(f"   Success! Found {len(logs)} logs.")
            print(f"   Last log message: {logs[0]['message_in']}")
        else:
            print("   Failed: No logs found.")
    except Exception as e:
        print(f"   Failed: {e}")

if __name__ == "__main__":
    # Wait for server to start
    time.sleep(2)
    test_management()
