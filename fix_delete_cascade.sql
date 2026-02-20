
-- Migration to add ON DELETE CASCADE to foreign keys
-- Run this in the SQL Editor of your Agent Supabase project

-- 1. Messages
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_lead_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_lead_id_fkey 
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

-- 2. Token Usage
ALTER TABLE token_usage DROP CONSTRAINT IF EXISTS token_usage_lead_id_fkey;
ALTER TABLE token_usage ADD CONSTRAINT token_usage_lead_id_fkey 
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

-- 3. Follow-ups
ALTER TABLE follow_ups DROP CONSTRAINT IF EXISTS follow_ups_lead_id_fkey;
ALTER TABLE follow_ups ADD CONSTRAINT follow_ups_lead_id_fkey 
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

-- 4. Agent Learnings (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_learnings') THEN
        ALTER TABLE agent_learnings DROP CONSTRAINT IF EXISTS agent_learnings_lead_phone_fkey; -- It might not be a FK currently, but good to check context
        -- agent_learnings uses phone, not ID, so usually no cascade needed unless we reference ID. 
        -- Checking setup: lead_phone is text, no FK to leads(phone) usually enforced strictly in distributed systems but good practice if local.
        -- Assuming loose coupling for learnings based on phone. Skipping cascade for learnings as it relies on phone text.
    END IF;
END $$;
