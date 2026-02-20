from .database import SupabaseClient
from .agent_engine import AgentEngine
from .tools_registry import ToolsRegistry
from .rag_engine import RAGEngine
from .learning_engine import LearningEngine
import os
import json
import requests
import traceback
import asyncio

class Orchestrator:
    def __init__(self, db_client: SupabaseClient):
        self.admin_db = db_client # Persist admin DB connection
        self.db = db_client       # Current DB connection (defaults to admin)

    async def load_agent_config(self, client_id: str):
        try:
            # Always load config from ADMIN DB first
            # Always load config from ADMIN DB first
            # agent_configs table now uses the text ID (slug) directly
            res = self.admin_db.client.table("agent_configs").select("*").eq("client_id", client_id).execute()
            
            if res.data:
                config = res.data[0]
                # DEBUG LOG
                s_url = config.get('supabase_url')
                print(f"[DEBUG] Loaded Config for {client_id}")
                print(f"[DEBUG] Supabase URL in DB: '{s_url}'")
                return config
            
            print(f"Agent config not found for client_id: {client_id}")
            return None
        except Exception as e:
            print(f"Error loading config: {e}")
            return None

    def _get_temporal_context(self) -> str:
        from datetime import datetime
        import locale
        try:
            locale.setlocale(locale.LC_TIME, 'pt_BR.UTF-8') 
        except:
            pass
            
        current_date = datetime.now()
        return f"""
CONTEXTO TEMPORAL:
- Data atual: {current_date.strftime('%d/%m/%Y')}
- Dia da semana: {current_date.strftime('%A')}
- Ano atual: {current_date.year}
- Hora atual: {current_date.strftime('%H:%M')}

IMPORTANTE: 
- Quando o cliente mencionar apenas dia/mês (ex: "20/02"), assuma o ANO ATUAL ({current_date.year}).
- Se a data mencionada já passou neste ano, assuma o PRÓXIMO ANO ({current_date.year + 1}).
- SEMPRE use o formato DD/MM/YYYY nas chamadas de ferramentas.
"""

    def _preprocess_message(self, msg: str) -> str:
        corrections = {
            'qero': 'quero', 'disponibilidde': 'disponibilidade', 'reseva': 'reserva',
            'vlw': 'valeu', 'blz': 'beleza', 'tbm': 'também', 'vc': 'você', 'pq': 'porque',
        }
        msg_lower = msg.lower()
        for wrong, correct in corrections.items():
            if msg_lower == wrong: return correct
            msg_lower = msg_lower.replace(f" {wrong} ", f" {correct} ")
            msg_lower = msg_lower.replace(f" {wrong}", f" {correct}")
            msg_lower = msg_lower.replace(f"{wrong} ", f"{correct} ")
        return msg_lower

    def _setup_dynamic_client(self, config: dict):
        """
        Switches self.db to a specific Supabase client if configured.
        Otherwise keeps the admin client.
        """
        supabase_url = config.get('supabase_url')
        supabase_key = config.get('supabase_service_role_key')

        # Clean strings
        if supabase_url: supabase_url = supabase_url.strip()
        if supabase_key: supabase_key = supabase_key.strip()
        
        if supabase_url and supabase_key:
            try:
                print(f"[DEBUG] Switching to isolated Supabase: {supabase_url}")
                self.db = SupabaseClient(supabase_url, supabase_key)
            except Exception as e:
                print(f"[ERROR] Failed to initialize isolated Supabase: {e}")
                raise Exception(f"Failed to initialize isolated Supabase: {e}")
        else:
            print(f"[DEBUG] No isolated Supabase configured (URL='{supabase_url}'). Using Admin DB.")
            self.db = self.admin_db

    async def _fallback_handler(self, client_id: str, lead_phone: str, error_msg: str, webhook_url: str = None):
        """
        Handles critical failures by:
        1. Logging the error.
        2. Alerting via Webhook (if configured).
        3. Returning a safe code-free response to the user.
        """
        print(f"[CRITICAL FAIL] fallback triggered for {client_id}: {error_msg}")
        
        # 1. Alert Webhook
        if webhook_url:
            try:
                payload = {
                    "event": "agent_failure",
                    "client_id": client_id,
                    "lead_phone": lead_phone,
                    "error": error_msg,
                    "timestamp": str(datetime.now())
                }
                requests.post(webhook_url, json=payload, timeout=5)
                print(f"[DEBUG] Webhook alert sent to {webhook_url}")
            except Exception as e:
                print(f"[ERROR] Failed to trigger error webhook: {e}")

        # 2. Safe Response
        safe_message = "Desculpe, estou passando por uma instabilidade técnica momentânea. Já notifiquei minha equipe. Poderia repetir em alguns instantes?"
        
        return {
            "success": True, # We return True so the user sees the message
            "type": "message",
            "response": safe_message,
            "tokens_used": 0,
            "client_id": client_id,
            "lead_phone": lead_phone,
            "fallback_triggered": True
        }

    async def execute_agent(self, client_id: str, lead_phone: str, message: str, lead_name: str = None, openai_api_key: str = None):
        print(f"[DEBUG] Executing Agent for Client: {client_id}")
        
        # 1. Validate Client & Load Config (FROM ADMIN DB)
        config = await self.load_agent_config(client_id)
        if not config:
            return {"success": False, "error": "Client configuration not found", "error_type": "active_config_not_found"}

        if not config.get('active'):
            return {"success": False, "error": "Agent is inactive", "error_type": "agent_inactive"}
        
        # 2. Setup Dynamic Client (Multi-Supabase)
        try:
            self._setup_dynamic_client(config)
        except Exception as e:
             return {"success": False, "error": str(e), "error_type": "database_connection_error"}

        openai_api_key = openai_api_key or config.get('openai_api_key')
        if not openai_api_key:
             return {"success": False, "error": "OpenAI API Key not configured for this client", "error_type": "config_error"}

        # 3. Get/Create Lead (IN TARGET DB)
        try:
            lead = await self.db.get_or_create_lead(client_id, lead_phone, lead_name)
            if not lead:
                 return {"success": False, "error": "Failed to initialize lead (check DB permissions/schema)", "error_type": "internal_error"}
        except Exception as e:
             return {"success": False, "error": f"DB Error (Lead): {str(e)}", "error_type": "database_error"}

        # 4. Save User Message (IN TARGET DB)
        try:
            await self.db.save_message(client_id, lead['id'], message, "user")
        except Exception as e:
             print(f"Error saving message: {e}")

        # --- RETRY LOOP STARTS ---
        max_retries = 3
        last_error = None
        
        for attempt in range(max_retries):
            try:
                # 5. Context Building (FROM TARGET DB)
                history = await self.db.get_conversation_history(client_id, lead['id'], limit=10) 
                history_str = "\n".join([f"{msg['role']}: {msg['content']}" for msg in history])
                
                context = {
                    "client_id": client_id,
                    # "lead_id": lead['id'], # REMOVED to prevent hallucination
                    "lead_phone": lead_phone,
                    "history_str": history_str
                }

                # --- INTELLIGENCE ENHANCEMENTS ---
                temporal_context = self._get_temporal_context()
                
                # 5.1 RAG Injection
                rag_context = ""
                if config.get('rag_enabled', False):
                    try:
                        print(f"[DEBUG] RAG Enabled for {client_id}")
                        rag = RAGEngine(self.db)
                        rag_results = await rag.search(message, client_id, top_k=config.get('rag_top_k', 3))
                        if rag_results:
                            rag_context = "\n\nBASE DE CONHECIMENTO (Use estas informações para responder):\n" + "\n---\n".join(rag_results)
                    except Exception as e:
                        print(f"[ERROR] RAG Injection failed: {e}")

                # 5.2 Learning Injection
                learning_context = ""
                try:
                    learning = LearningEngine()
                    learnings = await learning.get_learnings(client_id, lead_phone, limit=3)
                    if learnings:
                        l_texts = []
                        for l in learnings:
                            l_texts.append(f"- O usuário disse '{l['original_input']}' e o correto é '{l.get('corrected_output')}' (Tipo: {l.get('interaction_type')})")
                        learning_context = "\n\nAPRENDIZADOS PASSADOS (Evite cometer estes erros novamente):\n" + "\n".join(l_texts)
                except Exception as e:
                    print(f"[ERROR] Learning Injection failed: {e}")

                system_prompt = f"{config['system_prompt']}\n{rag_context}\n{learning_context}\n\n{temporal_context}"
                processed_message = self._preprocess_message(message)
                # --- END INTELLIGENCE ENHANCEMENTS ---
        
                # 6. Initialize Engine (With TARGET DB)
                tools_registry = ToolsRegistry(self.db)
                engine = AgentEngine(tools_registry)
        
                # 7. Execute Agent
                result = await engine.execute(
                    system_prompt=system_prompt,
                    user_message=processed_message,
                    tool_names=config.get('enabled_tools', []),
                    context=context,
                    openai_api_key=openai_api_key,
                    model=config.get('model', 'gpt-4o-mini'),
                    temperature=config.get('temperature', 0.7),
                    max_tokens=config.get('max_tokens', 1000)
                )
        
                if result['success']:
                    if result.get('type') == 'message':
                        response_content = result.get('response')
                        # 8. Save Assistant Message (IN TARGET DB)
                        try:
                            await self.db.save_message(client_id, lead['id'], response_content, "assistant", tokens=result.get('tokens_used', 0))
                            
                            # 9. Log Usage (IN TARGET DB)
                            p_tokens = result.get('prompt_tokens', 0)
                            c_tokens = result.get('completion_tokens', 0)
                            
                            if p_tokens == 0 and c_tokens == 0 and result.get('tokens_used', 0) > 0:
                                c_tokens = result.get('tokens_used', 0)
                                
                            cost = (p_tokens / 1_000_000 * 0.15) + (c_tokens / 1_000_000 * 0.60)
                            
                            await self.db.log_token_usage(
                                client_id=client_id, 
                                lead_id=lead['id'], 
                                model=config.get('model', 'gpt-4o-mini'), 
                                tokens_in=p_tokens, 
                                tokens_out=c_tokens,
                                cost=cost
                            )
                        except Exception as e:
                            print(f"Error saving response/usage: {e}")
                        
                        return {
                            "success": True,
                            "type": "message",
                            "response": response_content,
                            "tokens_used": result.get('tokens_used', 0),
                            "client_id": client_id,
                            "lead_phone": lead_phone,
                            "db_mode": "isolated" if config.get('supabase_url') else "admin"
                        }
                    elif result.get('type') == 'tool_call':
                        return result # Return immediately for tool processing
                else:
                    # Logic error from engine, not exception
                    raise Exception(f"Engine Error: {result.get('error')}")

            except Exception as e:
                last_error = f"{type(e).__name__}: {str(e)}"
                print(f"[RETRY] Attempt {attempt+1}/{max_retries} failed for {client_id}: {last_error}")
                # traceback.print_exc()
                await asyncio.sleep(1) # Small backoff
        
        # --- END RETRY LOOP ---

        # If we get here, all retries failed. Trigger Fallback.
        return await self._fallback_handler(
            client_id, 
            lead_phone, 
            last_error or "Unknown Error", 
            config.get('error_webhook')
        )

    async def resume_agent(self, client_id: str, lead_phone: str, messages: list, tool_call_id: str, tool_name: str, tool_result: dict):
        print(f"[DEBUG] Resuming Agent for Client: {client_id}")
        # 1. Load Config (FROM ADMIN DB)
        config = await self.load_agent_config(client_id)
        if not config:
            return {"success": False, "error": "Client configuration not found", "error_type": "active_config_not_found"}
        
        # 2. Setup Dynamic Client (Multi-Supabase)
        try:
            self._setup_dynamic_client(config)
        except Exception as e:
             return {"success": False, "error": str(e), "error_type": "database_connection_error"}
        
        openai_api_key = config.get('openai_api_key')
        
        # 3. Initialize Engine (With TARGET DB)
        tools_registry = ToolsRegistry(self.db)
        engine = AgentEngine(tools_registry)
        
        # 4. Resume execution
        result = await engine.resume(
            messages=messages,
            tool_call_id=tool_call_id,
            tool_name=tool_name,
            tool_result=tool_result,
            openai_api_key=openai_api_key,
            model=config.get('model', 'gpt-4o-mini'),
            temperature=config.get('temperature', 0.7),
            max_tokens=config.get('max_tokens', 1000)
        )
        
        if result['success'] and result.get('type') == 'message':
             # Save and Log (IN TARGET DB)
            try:
                lead = await self.db.get_or_create_lead(client_id, lead_phone) 
                if lead:
                    await self.db.save_message(client_id, lead['id'], result.get('response'), "assistant", tokens=result.get('tokens_used', 0))
                    
                    # Calculate Cost
                    p_tokens = result.get('prompt_tokens', 0)
                    c_tokens = result.get('completion_tokens', 0)
                    cost = (p_tokens / 1_000_000 * 0.15) + (c_tokens / 1_000_000 * 0.60)

                    await self.db.log_token_usage(
                        client_id=client_id, 
                        lead_id=lead['id'], 
                        model=config.get('model', 'gpt-4o-mini'), 
                        tokens_in=p_tokens, 
                        tokens_out=c_tokens,
                        cost=cost
                    )
            except Exception as e:
                print(f"Error saving resumed response: {e}")
            
            return {
                "success": True,
                "type": "message",
                "response": result.get('response'),
                "tokens_used": result.get('tokens_used', 0),
                "client_id": client_id,
                "lead_phone": lead_phone
            }
        
        return result
