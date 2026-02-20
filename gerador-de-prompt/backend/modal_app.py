import modal
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json

# Criar app Modal
app = modal.App("prompt-engine")

# Imagem com dependências
image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "fastapi",
    "pydantic",
    "openai",
    "pypdf2",
    "supabase",
    "python-multipart"
)


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("zaprompt-secrets")],
    timeout=300
)
@modal.asgi_app()
def fastapi_app():
    from openai import OpenAI
    from supabase import create_client
    import PyPDF2
    import io
    import os

    web_app = FastAPI(title="ZapPrompt - Prompt Engine")

    # CORS - allow frontend origins
    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Initialize clients
    openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    supabase = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_KEY"]
    )

    # ── Pydantic Models ──────────────────────────────────────────

    class AnalyzeRequest(BaseModel):
        pdf_text: Optional[str] = None
        framework: Optional[str] = None
        form_data: dict

    class GeneratePromptRequest(BaseModel):
        resumo: dict
        template_customizado: Optional[str] = None

    class SavePromptRequest(BaseModel):
        user_id: str
        nome_agente: str
        nome_empresa: str
        email_empresa: Optional[str] = None
        telefone: Optional[str] = None
        form_data: dict
        framework_text: Optional[str] = None
        resumo: Optional[dict] = None
        prompt_final: Optional[str] = None
        status: str = "draft"
        qualidade_score: Optional[int] = None

    # ── Endpoints ────────────────────────────────────────────────

    @web_app.get("/health")
    async def health():
        return {"status": "ok", "service": "prompt-engine", "version": "1.0.0"}

    @web_app.post("/api/extract-pdf")
    async def extract_pdf(file: UploadFile = File(...)):
        """Extrai texto de PDF."""
        try:
            contents = await file.read()
            pdf_file = io.BytesIO(contents)
            pdf_reader = PyPDF2.PdfReader(pdf_file)

            text = ""
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

            return {
                "success": True,
                "text": text.strip(),
                "pages": len(pdf_reader.pages)
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @web_app.post("/api/analisar")
    async def analisar_dados(request: AnalyzeRequest):
        """Analisa PDF + Framework e gera RESUMO estruturado."""
        try:
            analysis_prompt = f"""
Você é um especialista em análise de requisitos para agentes de IA.

Analise as seguintes informações e gere um RESUMO ESTRUTURADO em JSON:

DADOS DO FORMULÁRIO:
{json.dumps(request.form_data, indent=2, ensure_ascii=False)}

{f"PDF EXTRAÍDO:\\n{request.pdf_text[:3000]}" if request.pdf_text else ""}

{f"FRAMEWORK FORNECIDO:\\n{request.framework[:2000]}" if request.framework else ""}

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
  "tem_framework": true,
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
                "success": True,
                "resumo": resumo,
                "tokens_used": response.usage.total_tokens
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @web_app.post("/api/gerar-prompt")
    async def gerar_prompt(request: GeneratePromptRequest):
        """Gera PROMPT FINAL otimizado, validado e sem alucinações."""
        try:
            resumo = request.resumo

            # Build generation template
            integracoes_section = ""
            if resumo.get("integracoes"):
                integracoes_section = "\n## INTEGRAÇÕES\n[lista de sistemas]"

            compliance_section = ""
            if resumo.get("lgpd"):
                compliance_section = "\n## COMPLIANCE\n[LGPD e requisitos legais]"

            template = f"""
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

Gere o prompt COMPLETO agora.
"""

            if request.template_customizado:
                template = f"""
Você é um especialista em criar system prompts para agentes de IA.

Use este TEMPLATE CUSTOMIZADO como base:
{request.template_customizado}

E preencha com as informações deste resumo:
{json.dumps(resumo, indent=2, ensure_ascii=False)}

REGRAS:
1. Use APENAS informações do resumo - NÃO invente nada
2. Mantenha a estrutura do template customizado
3. Seja CLARO e OBJETIVO
4. Máximo 800 palavras

Gere o prompt COMPLETO agora.
"""

            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "Você é um especialista em system prompts. Seja preciso e profissional."},
                    {"role": "user", "content": template}
                ],
                temperature=0.4,
                max_tokens=2000
            )

            prompt_gerado = response.choices[0].message.content

            # Validate quality
            validation_prompt = f"""
Analise este system prompt e avalie a QUALIDADE:

{prompt_gerado}

Verifique:
1. Instruções contraditórias? (sim/não)
2. Informações redundantes? (sim/não)
3. Clareza (0-100)
4. Alucinações/invenções? (sim/não)
5. Completude (0-100)

Retorne JSON:
{{
  "score_total": 0-100,
  "tem_contradicoes": false,
  "tem_redundancias": false,
  "clareza": 0-100,
  "tem_alucinacoes": false,
  "completude": 0-100,
  "sugestoes": ["lista de melhorias se score < 85"]
}}
"""

            validation = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "Você é um validador rigoroso de prompts."},
                    {"role": "user", "content": validation_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )

            qualidade = json.loads(validation.choices[0].message.content)

            return {
                "success": True,
                "prompt": prompt_gerado,
                "qualidade": qualidade,
                "tokens_used": response.usage.total_tokens + validation.usage.total_tokens
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @web_app.post("/api/salvar-prompt")
    async def salvar_prompt(request: SavePromptRequest):
        """Salva prompt no Supabase."""
        try:
            data = {
                "user_id": request.user_id,
                "nome_agente": request.nome_agente,
                "nome_empresa": request.nome_empresa,
                "email_empresa": request.email_empresa,
                "telefone": request.telefone,
                "form_data": request.form_data,
                "framework_text": request.framework_text,
                "resumo": request.resumo,
                "prompt_final": request.prompt_final,
                "status": request.status,
                "qualidade_score": request.qualidade_score,
            }

            result = supabase.table("prompts").insert(data).execute()

            return {
                "success": True,
                "data": result.data[0] if result.data else {}
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @web_app.get("/api/prompts/{user_id}")
    async def listar_prompts(user_id: str):
        """Lista prompts do usuário."""
        try:
            result = (
                supabase.table("prompts")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            return {"success": True, "data": result.data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @web_app.get("/api/prompt/{prompt_id}")
    async def get_prompt(prompt_id: str):
        """Busca um prompt por ID."""
        try:
            result = (
                supabase.table("prompts")
                .select("*")
                .eq("id", prompt_id)
                .single()
                .execute()
            )
            return {"success": True, "data": result.data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @web_app.delete("/api/prompt/{prompt_id}")
    async def deletar_prompt(prompt_id: str):
        """Deleta um prompt por ID."""
        try:
            supabase.table("prompts").delete().eq("id", prompt_id).execute()
            return {"success": True}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    return web_app
