"""Prompt generation using OpenAI GPT-4o."""
import json
from openai import OpenAI


def analyze_data(openai_client: OpenAI, form_data: dict, pdf_text: str | None = None, framework: str | None = None) -> dict:
    """Analyze form data, PDF text, and framework to produce a structured summary.
    
    Returns:
        dict with 'resumo' and 'tokens_used'.
    """
    analysis_prompt = f"""
Você é um especialista em análise de requisitos para agentes de IA.

Analise as seguintes informações e gere um RESUMO ESTRUTURADO em JSON:

DADOS DO FORMULÁRIO:
{json.dumps(form_data, indent=2, ensure_ascii=False)}

{f"PDF EXTRAÍDO:\\n{pdf_text[:3000]}" if pdf_text else ""}

{f"FRAMEWORK FORNECIDO:\\n{framework[:2000]}" if framework else ""}

Gere um JSON com esta estrutura EXATA:
{{
  "nome_agente": "string",
  "nome_empresa": "string",
  "email": "string",
  "telefone": "string",
  "funcao_principal": "string (resumida em 1 frase)",
  "problemas_resolve": ["lista", "de", "problemas"],
  "publico_alvo": "string",
  "nivel_conhecimento": "leigo|intermediario|avancado",
  "tom_voz": ["lista", "de", "tons"],
  "pode_decisoes": "orientar|simples|regras",
  "nao_pode_fazer": ["lista", "de", "restricoes"],
  "palavras_evitar": ["lista"],
  "regras_obrigatorias": ["lista"],
  "integracoes": ["lista"],
  "info_sensiveis": ["lista"],
  "lgpd": "string ou null",
  "metricas_sucesso": ["lista"],
  "tem_framework": boolean,
  "framework_tipo": "vendas|atendimento|suporte|custom|null"
}}

IMPORTANTE:
- Seja PRECISO e CONCISO
- Não invente informações
- Use exatamente os dados fornecidos
- Se algo não estiver claro, use null ou []
"""
    
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Você é um analisador preciso de requisitos."},
            {"role": "user", "content": analysis_prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.3
    )
    
    resumo = json.loads(response.choices[0].message.content)
    
    return {
        "resumo": resumo,
        "tokens_used": response.usage.total_tokens
    }


def generate_prompt(openai_client: OpenAI, resumo: dict, template_customizado: str | None = None) -> dict:
    """Generate a final system prompt from the structured summary.
    
    Returns:
        dict with 'prompt', 'tokens_used'.
    """
    from templates.system_prompt_template import build_generation_prompt
    
    generation_prompt = build_generation_prompt(resumo, template_customizado)
    
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Você é um especialista em system prompts. Seja preciso e profissional."},
            {"role": "user", "content": generation_prompt}
        ],
        temperature=0.4,
        max_tokens=2000
    )
    
    return {
        "prompt": response.choices[0].message.content,
        "tokens_used": response.usage.total_tokens
    }
