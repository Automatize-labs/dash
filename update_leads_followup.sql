ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS last_followup_minutes INT DEFAULT 0;

-- Optional: Add index for performance
CREATE INDEX IF NOT EXISTS idx_leads_last_msg_followup 
ON leads (status, last_followup_minutes);
