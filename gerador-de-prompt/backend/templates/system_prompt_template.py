"""System prompt generation template."""
import json


def build_generation_prompt(resumo: dict, template_customizado: str | None = None) -> str:
    """Build the GPT prompt that generates the final system prompt.
    
    Args:
        resumo: Structured summary dict from the analysis step.
        template_customizado: Optional custom template override.
        
    Returns:
        The prompt string to send to GPT-4o.
    """
    if template_customizado:
        return f"""
Você é um especialista em criar system prompts para agentes de IA.

Use este TEMPLATE CUSTOMIZADO como base:
{template_customizado}

E preencha com as informações deste resumo:
{json.dumps(resumo, indent=2, ensure_ascii=False)}

REGRAS:
1. Use APENAS informações do resumo - NÃO invente nada
2. Mantenha a estrutura do template customizado
3. Seja CLARO e OBJETIVO
4. Máximo 800 palavras

Gere o prompt COMPLETO agora.
"""
    
    integracoes_section = ""
    if resumo.get("integracoes"):
        integracoes_section = "\n## INTEGRAÇÕES\n[lista de sistemas]"
    
    compliance_section = ""
    if resumo.get("lgpd"):
        compliance_section = "\n## COMPLIANCE\n[LGPD e requisitos legais]"
    
    return f"""
Você é um especialista em criar system prompts para agentes de IA.

Crie um SYSTEM PROMPT PROFISSIONAL baseado neste resumo:

{json.dumps(resumo, indent=2, ensure_ascii=False)}

REGRAS CRÍTICAS:
1. Use APENAS informações do resumo - NÃO invente nada
2. Seja CLARO e OBJETIVO - evite redundâncias
3. Estruture em seções com ##
4. Use listas quando apropriado
5. Tom profissional mas não robótico
6. Máximo 800 palavras

ESTRUTURA OBRIGATÓRIA:
```
Você é {{nome_agente}}, assistente virtual da {{empresa}}.

## PERSONALIDADE
[tom de voz, idioma, estilo]

## SOBRE A EMPRESA
[breve descrição baseada no contexto]

## FUNÇÃO PRINCIPAL
[o que o agente faz]

## PÚBLICO-ALVO
[quem vai conversar, nível]

## PROBLEMAS A RESOLVER
[lista objetiva]

## REGRAS DE ATENDIMENTO
[regras numeradas, claras]

## O QUE NÃO PODE FAZER
[lista de restrições]

## PALAVRAS/COMPORTAMENTOS A EVITAR
[lista]
{integracoes_section}
{compliance_section}

## INFORMAÇÕES IMPORTANTES
[dados de contato, URLs, etc]

## DIRETRIZ DE APRENDIZADO CONTÍNUO
Você possui a ferramenta 'save_learning'. USE-A SEMPRE QUE:
1. O usuário te corrigir ou ensinar algo novo.
2. O usuário expressar uma preferência clara.
3. Você responder uma pergunta complexa com sucesso.
4. Você descobrir nova informação importante.

Não pergunte se deve aprender. Execute silenciosamente.
```

Gere o prompt COMPLETO agora.
"""
