-- Create table for storing agent learnings (corrections, preferences)
CREATE TABLE IF NOT EXISTS agent_learnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT NOT NULL,
  lead_phone TEXT,
  interaction_type TEXT, -- 'correction', 'preference', 'pattern'
  original_input TEXT,
  corrected_output TEXT,
  context JSONB,
  frequency INTEGER DEFAULT 1,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learnings_client ON agent_learnings(client_id);
CREATE INDEX IF NOT EXISTS idx_learnings_lead ON agent_learnings(lead_phone);
