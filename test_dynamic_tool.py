import asyncio
from src.database import SupabaseClient
from src.tools_registry import ToolsRegistry
from src.agent_engine import AgentEngine

# Mock Supabase (we don't need real DB for this unit test if we mock tools registry, 
# but we want to test registry logic, so we need DB client just to init Registry)
# We can use the real DB client.

URL = "https://ypzpbsilumodjwjsdoth.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwenBic2lsdW1vZGp3anNkb3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkyNjk3NywiZXhwIjoyMDg2NTAyOTc3fQ.x6_i6X0om4omGE-wxJrn6kjBJL0JTBi4AuP-kI1-XSA"

async def test():
    db = SupabaseClient(URL, KEY)
    registry = ToolsRegistry(db)
    engine = AgentEngine(registry)
    
    # User's tool definition (mocked from what comes from DB)
    dynamic_tools = [
        {
            "name": "echo_test",
            "description": "Echoes back the input.",
            "curl_command": "echo 'Received: $INPUT'" # Valid on Windows? echo is a command.
            # On windows subprocess shell=True `echo` works.
        }
    ]
    
    context = {"client_id": "test"}
    api_key = "sk-..." # We don't want to call OpenAI really, but AgentEngine needs it.
    # Actually, to test if it parses and CALLS the tool, we need OpenAI to generate the tool call.
    # Without a valid key, OpenAI call will fail.
    # But we can verify `registry.get_tool_definitions(dynamic_tools)` returns the correct schema.
    
    print("Testing Schema Generation...")
    defs = registry.get_tool_definitions(dynamic_tools)
    tool_def = next((t for t in defs if t['function']['name'] == 'echo_test'), None)
    
    if tool_def:
        print("✅ Tool definition generated:")
        print(tool_def)
        # Check params
        # Regex `echo 'Received: $INPUT'` should capture INPUT
        props = tool_def['function']['parameters']['properties']
        if 'INPUT' in props:
             print("✅ Parameter 'INPUT' extracted successfully.")
        else:
             print("❌ Parameter 'INPUT' parsing failed.")
    else:
        print("❌ Tool definition NOT found.")

    print("\nTesting Tool Execution (Mocking OpenAI decision)...")
    # Manually execute via registry
    # First, we must "load" them into value map by calling get_tool_definitions
    registry.get_tool_definitions(dynamic_tools)
    
    result = await registry.execute_tool("echo_test", INPUT="Hello World")
    print(f"Execution Result (should allow echo): {result}")
    
    # Ideally output is "Received: Hello World" (quoted or not depending on echo)

if __name__ == "__main__":
    asyncio.run(test())
