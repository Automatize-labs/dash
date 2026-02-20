-- Run this SQL in the SQL Editor of your NEW Agent Supabase project

-- 1. Enable Vector Extension (for Knowledge Base)
create extension if not exists vector;

-- 2. Create Leads Table
create table if not exists leads (
    id uuid primary key default uuid_generate_v4(),
    client_id text not null, -- Stores the text ID (e.g. 'pousada')
    phone text not null,
    name text,
    status text default 'active',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(client_id, phone)
);

-- 3. Create Messages Table
create table if not exists messages (
    id uuid primary key default uuid_generate_v4(),
    client_id text not null,
    lead_id uuid references leads(id),
    role text not null, -- 'user', 'assistant', 'system'
    content text not null,
    tokens_used int default 0,
    created_at timestamp with time zone default now()
);

-- 4. Create Token Usage Table
create table if not exists token_usage (
    id uuid primary key default uuid_generate_v4(),
    client_id text not null,
    lead_id uuid references leads(id),
    model text not null,
    tokens_in int default 0,
    tokens_out int default 0,
    tokens_used int generated always as (tokens_in + tokens_out) stored,
    cost float default 0,
    estimated_cost float default 0, -- Legacy support
    created_at timestamp with time zone default now()
);

-- 5. Create Knowledge Base Table
create table if not exists knowledge_base (
    id uuid primary key default uuid_generate_v4(),
    client_id text not null,
    title text,
    content text not null,
    category text,
    metadata jsonb default '{}',
    embedding vector(1536),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 6. Create Follow-ups Table (NEW)
create table if not exists follow_ups (
    id uuid primary key default uuid_generate_v4(),
    client_id text not null,
    lead_id uuid references leads(id),
    scheduled_at timestamp with time zone not null,
    status text default 'pending', -- 'pending', 'sent', 'cancelled'
    content text,
    created_at timestamp with time zone default now()
);

-- 7. Create Indexes for Performance
create index if not exists idx_leads_client_phone on leads(client_id, phone);
create index if not exists idx_messages_lead_id on messages(lead_id);
create index if not exists idx_messages_client_id on messages(client_id);
create index if not exists idx_kb_client_id on knowledge_base(client_id);
create index if not exists idx_follow_ups_pending on follow_ups(status, scheduled_at);
