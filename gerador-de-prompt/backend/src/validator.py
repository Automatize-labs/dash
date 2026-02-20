"""Prompt quality validation using OpenAI."""
import json
from openai import OpenAI


def validate_prompt(openai_client: OpenAI, prompt_text: str) -> dict:
    """Validate a generated prompt for quality, contradictions, and hallucinations.
    
    Returns:
        dict with quality metrics and score.
    """
    validation_prompt = f"""
Analise este system prompt e avalie a QUALIDADE:

{prompt_text}

Verifique:
1. Instruções contraditórias? (sim/não)
2. Informações redundantes? (sim/não)
3. Clareza (0-100)
4. Alucinações/invenções? (sim/não)
5. Completude (0-100)

Retorne JSON:
{{
  "score_total": 0-100,
  "tem_contradicoes": boolean,
  "tem_redundancias": boolean,
  "clareza": 0-100,
  "tem_alucinacoes": boolean,
  "completude": 0-100,
  "sugestoes": ["lista de melhorias se score < 85"]
}}
"""
    
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Você é um validador rigoroso de prompts."},
            {"role": "user", "content": validation_prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.2
    )
    
    qualidade = json.loads(response.choices[0].message.content)
    
    return {
        "qualidade": qualidade,
        "tokens_used": response.usage.total_tokens
    }
