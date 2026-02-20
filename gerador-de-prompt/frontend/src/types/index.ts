export interface Prompt {
    id: string;
    user_id: string;
    nome_agente: string;
    nome_empresa: string;
    email_empresa?: string;
    telefone?: string;
    form_data: Record<string, unknown>;
    framework_text?: string;
    resumo?: Resumo;
    prompt_final?: string;
    status: "draft" | "reviewed" | "final";
    qualidade_score?: number;
    created_at: string;
    updated_at: string;
}

export interface Resumo {
    nome_agente: string;
    nome_empresa: string;
    email: string;
    telefone: string;
    funcao_principal: string;
    problemas_resolve: string[];
    publico_alvo: string;
    nivel_conhecimento: "leigo" | "intermediario" | "avancado";
    tom_voz: string[];
    pode_decisoes: "orientar" | "simples" | "regras";
    nao_pode_fazer: string[];
    palavras_evitar: string[];
    regras_obrigatorias: string[];
    integracoes: string[];
    info_sensiveis: string[];
    lgpd: string | null;
    metricas_sucesso: string[];
    tem_framework: boolean;
    framework_tipo: "vendas" | "atendimento" | "suporte" | "custom" | null;
}

export interface Qualidade {
    score_total: number;
    tem_contradicoes: boolean;
    tem_redundancias: boolean;
    clareza: number;
    tem_alucinacoes: boolean;
    completude: number;
    sugestoes: string[];
}

export interface Framework {
    id: string;
    user_id: string;
    nome: string;
    descricao?: string;
    tipo: "vendas" | "atendimento" | "suporte" | "custom";
    conteudo: string;
    is_public: boolean;
    created_at: string;
}

export interface FormData {
    nome_agente: string;
    nome_empresa: string;
    email_empresa: string;
    telefone: string;
    funcao_principal: string;
    problemas: string;
    publico_alvo: string;
    nivel_conhecimento: string;
    tom_voz: string;
    pode_decisoes: string;
    nao_pode_fazer: string;
    palavras_evitar: string;
    regras_obrigatorias: string;
    integracoes: string;
    info_sensiveis: string;
    lgpd: string;
    metricas_sucesso: string;
}
