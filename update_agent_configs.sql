
CREATE TABLE IF NOT EXISTS agent_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id TEXT NOT NULL UNIQUE,
    system_prompt TEXT,
    model TEXT DEFAULT 'gpt-4o-mini',
    temperature FLOAT DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    openai_api_key TEXT,
    rag_enabled BOOLEAN DEFAULT TRUE,
    rag_top_k INTEGER DEFAULT 3,
    enabled_tools JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure columns exist (Migration)
DO $$
BEGIN
    BEGIN
        ALTER TABLE agent_configs ADD COLUMN client_id TEXT;
        ALTER TABLE agent_configs ADD CONSTRAINT agent_configs_client_id_key UNIQUE (client_id);
    EXCEPTION
        WHEN duplicate_column THEN NULL;
        WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER TABLE agent_configs ADD COLUMN supabase_url TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE agent_configs ADD COLUMN supabase_service_role_key TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE agent_configs ADD COLUMN error_webhook TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- Ensure enabled_tools is JSONB if table already exists (and it wasn't jsonb)
-- This is tricky if it was text[], but let's assume it was created correctly or doesn't exist.
-- If it exists as text[], we might need to cast.
-- For now, IF NOT EXISTS handles creation. 
-- If it exists, we assume it's capable of storing JSON. 
