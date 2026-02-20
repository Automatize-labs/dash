import psycopg2
import os

# Direct Connection parameters (Port 5432)
POSTGRES_URI = "postgresql://postgres:JHvxqYbyByvQgDGk@db.ypzpbsilumodjwjsdoth.supabase.co:5432/postgres"

def run_migration():
    print(f"Connecting to database (Direct - Port 5432)...")
    try:
        conn = psycopg2.connect(POSTGRES_URI)
        conn.autocommit = True
        cur = conn.cursor()
        print("Connected successfully.")
        
        commands = [
            # Tabela de clientes
            """
            CREATE TABLE IF NOT EXISTS clients (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              client_id TEXT UNIQUE NOT NULL,
              name TEXT NOT NULL,
              industry TEXT,
              active BOOLEAN DEFAULT true,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            """,
            
            # Tabela de configuração dos agentes
            """
            CREATE TABLE IF NOT EXISTS agent_configs (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              client_id TEXT UNIQUE REFERENCES clients(client_id) ON DELETE CASCADE,
              
              -- Configuração do prompt
              system_prompt TEXT NOT NULL,
              model TEXT DEFAULT 'gpt-4o-mini',
              temperature FLOAT DEFAULT 0.7,
              max_tokens INTEGER DEFAULT 1000,
              
              -- OpenAI API Key (Per Client)
              openai_api_key TEXT,
              
              -- Tools habilitadas (array JSON)
              enabled_tools JSONB DEFAULT '[]'::jsonb,
              
              -- Configuração RAG
              rag_enabled BOOLEAN DEFAULT true,
              rag_top_k INTEGER DEFAULT 3,
              
              -- Metadados
              active BOOLEAN DEFAULT true,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            """,
            
            # Índices
            "CREATE INDEX IF NOT EXISTS idx_agent_configs_client_id ON agent_configs(client_id);",
            "CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(active);",

            # Dados de teste
            # Upsert client
            """
            INSERT INTO clients (client_id, name, industry, active) 
            VALUES ('test_client', 'Empresa Teste', 'Vendas', true)
            ON CONFLICT (client_id) DO NOTHING;
            """,
            
            # Upsert agent config
            """
            INSERT INTO agent_configs (
              client_id, 
              system_prompt, 
              model,
              temperature,
              openai_api_key,
              enabled_tools,
              rag_enabled
            ) VALUES (
              'test_client',
              'Você é um assistente de vendas profissional e prestativo. Seu objetivo é ajudar clientes a encontrar o produto ideal, responder dúvidas e facilitar o processo de compra. Seja cordial, claro e objetivo.',
              'gpt-4o-mini',
              0.7,
              'sk-test-key-placeholder',
              '["get_conversation_history", "search_knowledge_base", "analyze_lead_profile"]'::jsonb,
              true
            )
            ON CONFLICT (client_id) DO UPDATE SET 
                openai_api_key = EXCLUDED.openai_api_key,
                system_prompt = EXCLUDED.system_prompt,
                enabled_tools = EXCLUDED.enabled_tools;
            """,
            
            # Knowledge base fake items
            """
            INSERT INTO knowledge_base (client_id, title, content, metadata) VALUES
            ('test_client', 'Horário de Atendimento', 'Nosso horário de atendimento é de segunda a sexta, das 9h às 18h.', '{"category": "geral"}'),
            ('test_client', 'Formas de Pagamento', 'Aceitamos cartão de crédito (até 12x), débito, PIX e boleto bancário.', '{"category": "vendas"}'),
            ('test_client', 'Política de Troca', 'Você tem 30 dias para trocar ou devolver produtos com defeito. Basta apresentar a nota fiscal.', '{"category": "pos-venda"}');
            """
        ]
        
        for i, cmd in enumerate(commands):
            try:
                print(f"Executing command {i+1}...")
                cur.execute(cmd)
            except Exception as e:
                print(f"Error executing command {i+1}: {e}")

        # Verification
        print("\n--- VALIDATION ---")
        cur.execute("SELECT client_id, openai_api_key FROM agent_configs WHERE client_id = 'test_client';")
        row = cur.fetchone()
        if row:
            print(f"✅ Agent Config for 'test_client' found. Key starting with: {row[1][:10]}...")
        else:
            print("❌ Agent Config for 'test_client' NOT FOUND.")

        cur.close()
        conn.close()
        print("Schema update finished.")
        
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    run_migration()
