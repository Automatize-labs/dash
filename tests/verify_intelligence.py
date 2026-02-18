
import sys
import os
import asyncio
from datetime import datetime
from unittest.mock import MagicMock

# Adjust path to include root
sys.path.append(os.getcwd())

# Mock modules for Orchestrator import
sys.modules["openai"] = MagicMock()
sys.modules["openai.AsyncOpenAI"] = MagicMock()
# Mock SupabaseClient to avoid connection errors during Orchestrator init
sys.modules["src.database"] = MagicMock()
sys.modules["src.database.SupabaseClient"] = MagicMock()

try:
    from src.agent_engine import AgentEngine
    from src.orchestrator import Orchestrator
except ImportError as e:
    print(f"Could not import src modules: {e}")
    sys.exit(1)

# Mock ToolsRegistry
class MockToolsRegistry:
    def get_tool_definitions(self, dynamic_tools=None):
        return []
    async def execute_tool(self, tool_name, **kwargs):
        return "RAG Result"

async def test_intelligence():
    print("--- Verifying Intelligence Features ---\n")
    
    # --- 1. Agent Engine Tests ---
    print("--- 1. Agent Engine Logic ---")
    registry = MockToolsRegistry()
    engine = AgentEngine(registry)
    
    # Date Normalization
    print("\n[Date Normalization]")
    current_year = datetime.now().year
    cases = [
        ("20/02", f"20/02/{current_year}" if datetime(current_year, 2, 20).date() >= datetime.now().date() else f"20/02/{current_year+1}"),
        ("20/02/2024", f"20/02/{current_year}"), # Fix: Past year -> Current
        ("23/02/2024", f"23/02/{current_year}"), # Fix
        ("01/01/2024", f"01/01/{current_year+1}"), 
        ("10/10/2026", "10/10/2026")
    ]
    for inp, exp in cases:
        res = engine._normalize_date(inp)
        status = "✅" if res == exp else f"❌ (Expected {exp})"
        print(f"Input: {inp:<10} -> Output: {res} {status}")

    # Auto RAG
    print("\n[Auto RAG Triggers]")
    rag_cases = [
        ("Qual o preço?", True),
        ("olá tudo bem", False),
        ("política de cancelamento", True),
        ("check-in horario", True)
    ]
    for msg, exp in rag_cases:
        res = await engine._should_use_rag(msg)
        status = "✅" if res == exp else "❌"
        print(f"Msg: '{msg}' -> RAG: {res} {status}")

    # --- 2. Orchestrator Tests ---
    print("\n--- 2. Orchestrator Logic ---")
    mock_db = MagicMock()
    orch = Orchestrator(mock_db)
    
    # Pre-processing
    print("\n[Pre-processing]")
    pp_cases = [
        ("qero uma reseva", "quero uma reserva"),
        ("vlw blz", "valeu beleza"),
        ("tbm pq vc", "também porque você"),
        ("Ola, qero saber disponibilidade", "ola, quero saber disponibilidade")
    ]
    for inp, exp in pp_cases:
        res = orch._preprocess_message(inp)
        status = "✅" if res == exp else f"❌ (Expected '{exp}')"
        print(f"Input: '{inp}'\nOutput: '{res}' {status}")

    # Temporal Context
    print("\n[Temporal Context]")
    ctx = orch._get_temporal_context()
    print(ctx.strip())
    if str(current_year) in ctx and datetime.now().strftime('%d/%m/%Y') in ctx:
        print("✅ Context contains current date/year")
    else:
        print("❌ Context missing current date info")

    # --- 3. Learning Engine Check ---
    print("\n--- 3. Learning Engine Check ---")
    # We can't easily test DB connection without real credentials/env vars loaded in this context.
    # Assuming the class exists and methods are defined is a good static check.
    try:
        from src.learning_engine import LearningEngine
        learner = LearningEngine()
        print(f"✅ LearningEngine imported successfully. DB URL present: {bool(learner.db_url)}")
    except Exception as e:
        print(f"❌ LearningEngine check failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_intelligence())
