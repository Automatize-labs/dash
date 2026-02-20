-- ZapPrompt - Supabase Schema
-- Ativar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de prompts salvos
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_agente TEXT NOT NULL,
  nome_empresa TEXT NOT NULL,
  email_empresa TEXT,
  telefone TEXT,
  
  -- Dados do formulário (JSON)
  form_data JSONB NOT NULL,
  
  -- Framework opcional
  framework_text TEXT,
  
  -- Resumo gerado
  resumo JSONB,
  
  -- Prompt final
  prompt_final TEXT,
  
  -- Metadados
  status TEXT DEFAULT 'draft', -- draft, reviewed, final
  qualidade_score INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de frameworks/templates
CREATE TABLE frameworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT, -- 'vendas', 'atendimento', 'suporte', 'custom'
  conteudo TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE frameworks ENABLE ROW LEVEL SECURITY;

-- Policies para prompts
CREATE POLICY "Users can view own prompts"
  ON prompts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompts"
  ON prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompts"
  ON prompts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts"
  ON prompts FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para frameworks
CREATE POLICY "Users can view own and public frameworks"
  ON frameworks FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own frameworks"
  ON frameworks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own frameworks"
  ON frameworks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own frameworks"
  ON frameworks FOR DELETE
  USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_prompts_user ON prompts(user_id);
CREATE INDEX idx_prompts_created ON prompts(created_at DESC);
CREATE INDEX idx_frameworks_user ON frameworks(user_id);
CREATE INDEX idx_frameworks_public ON frameworks(is_public);
