export interface Client {
    id: string
    client_id: string
    name: string
    industry: string | null
    active: boolean
    created_at: string
    updated_at: string
    agent_configs?: AgentConfig[]
}

export interface AgentConfig {
    id: string
    client_id: string
    system_prompt: string
    model: string
    temperature: number
    max_tokens: number
    enabled_tools: any[]
    rag_enabled: boolean
    rag_top_k: number
    openai_api_key: string | null
    active: boolean
    created_at: string
    updated_at: string
}

export interface KnowledgeBase {
    id: string
    client_id: string
    title: string
    content: string
    category: string | null
    created_at: string
}
