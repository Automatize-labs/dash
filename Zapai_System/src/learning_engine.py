
import os
import json
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

class LearningEngine:
    def __init__(self):
        self.db_url = os.environ.get("POSTGRES_DIRECT_URL")
        if not self.db_url:
            # Fallback or error
            print("[WARN] POSTGRES_DIRECT_URL not set for LearningEngine")

    def _get_connection(self):
        return psycopg2.connect(self.db_url, cursor_factory=RealDictCursor)

    async def get_learnings(self, client_id: str, lead_phone: str = None, limit: int = 5):
        """
        Retrieves relevant learnings for the context.
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    # Query for client-wide patterns OR specific lead corrections
                    query = """
                        SELECT original_input, corrected_output, interaction_type, context
                        FROM agent_learnings
                        WHERE client_id = %s
                        AND (lead_phone = %s OR lead_phone IS NULL)
                        ORDER BY last_seen DESC
                        LIMIT %s
                    """
                    cur.execute(query, (client_id, lead_phone, limit))
                    return cur.fetchall()
        except Exception as e:
            print(f"[ERROR] Failed to get learnings: {e}")
            return []

    async def save_learning(self, client_id: str, lead_phone: str, interaction_type: str, original_input: str, corrected_output: str = None, context: dict = None):
        """
        Saves a learning interaction.
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    query = """
                        INSERT INTO agent_learnings 
                        (client_id, lead_phone, interaction_type, original_input, corrected_output, context, frequency, last_seen)
                        VALUES (%s, %s, %s, %s, %s, %s, 1, NOW())
                        ON CONFLICT DO NOTHING
                    """
                    # Note: We might want a conflict update to increment frequency, 
                    # but for now simplicity. Table schema might not have unique constraint on these fields yet.
                    # Assuming we just insert for log history for now.
                    cur.execute(query, (
                        client_id, lead_phone, interaction_type, 
                        original_input, corrected_output, json.dumps(context or {})
                    ))
                    conn.commit()
        except Exception as e:
            print(f"[ERROR] Failed to save learning: {e}")

