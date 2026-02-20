from openai import OpenAI, AsyncOpenAI
import json
from .tools_registry import ToolsRegistry

class AgentEngine:
    INTERNAL_TOOLS = [
        "get_conversation_history",
        "search_knowledge_base", 
        "analyze_lead_profile"
    ]

    def __init__(self, tools_registry: ToolsRegistry):
        self.tools_registry = tools_registry

    def _normalize_date(self, date_str: str) -> str:
        """
        Normalizes dates to DD/MM/YYYY.
        - Handles relative years based on current date.
        - Corrects past years (e.g. LLM halluncinating 2024) to current/next year.
        """
        from datetime import datetime
        try:
            parts = date_str.strip().split('/')
            now = datetime.now()
            current_year = now.year
            
            day = int(parts[0])
            month = int(parts[1])
            year = current_year
            
            # If year provided, parse it
            if len(parts) == 3:
                y_str = parts[2]
                if len(y_str) == 2:
                    year = int(f"20{y_str}")
                else:
                    year = int(y_str)
                    
            # Logic: If date is in the past, move forward
            # 1. Start with provided day/month and CURRENT year (ignore provided year if < current)
            if year < current_year:
                year = current_year
                
            test_date = datetime(year, month, day)
            
            # 2. If valid date in current year is still in past (e.g. requested Jan in Feb), move to next year
            # ignoring time for comparison
            if test_date.date() < now.date():
                 year += 1
                 
            return f"{day:02d}/{month:02d}/{year}"

        except Exception as e:
             # print(f"Date norm error: {e}")
             pass
        return date_str

    async def _should_use_rag(self, message: str) -> bool:
        triggers = [
            'informação', 'política', 'regra', 'como funciona',
            'horário', 'preço', 'aceita', 'pode', 'permite',
            'cancelamento', 'pagamento', 'checkout', 'check-in', 'café'
        ]
        msg_lower = message.lower()
        if any(t in msg_lower for t in triggers):
            return True
        if any(msg_lower.startswith(q) for q in ['qual', 'quando', 'como', 'onde', 'quem']):
            return True
        return False
        
    async def execute(self, system_prompt: str, user_message: str, tool_names: list, context: dict, openai_api_key: str, model: str = 'gpt-4o-mini', temperature: float = 0.7, max_tokens: int = 1000):
        # ... (Existing execute code start) ...

        if not openai_api_key:
             return {"success": False, "error": "OpenAI API Key provided is empty"}

        client = AsyncOpenAI(api_key=openai_api_key)
        
        # 1. Prepare Tools
        # Parse enabled tools (tool_names can be list of strings or dicts from config)
        dynamic_tools_conf = [t for t in tool_names if isinstance(t, dict)]
        static_tool_names = [t for t in tool_names if isinstance(t, str)]
        
        # Get all definitions (Internal + Dynamic)
        all_defs = self.tools_registry.get_tool_definitions(dynamic_tools=dynamic_tools_conf)
        
        # Calculate allowed names
        dynamic_names = [t.get('name') for t in dynamic_tools_conf if t.get('name')]
        # Always allow internal tools + explicitly enabled static tools + dynamic tools
        allowed_names = set(static_tool_names + dynamic_names + self.INTERNAL_TOOLS)
        
        # Filter definitions
        tool_definitions = [t for t in all_defs if t['function']['name'] in allowed_names]
        
        # 2. Prepare Messages
        messages = [
            {"role": "system", "content": system_prompt},
        ]
        
        # Inject memory summary (Layer 1: compressed old context)
        if context.get("memory_summary"):
            messages.append({"role": "system", "content": f"RESUMO DA CONVERSA ANTERIOR:\n{context['memory_summary']}"})
        
        # Inject recent messages as real chat messages (Layer 2: detailed recent)
        if context.get("recent_messages"):
            for msg in context["recent_messages"]:
                messages.append({"role": msg["role"], "content": msg["content"]})
        elif context.get("history_str"):
            # Fallback for backward compatibility (resume_agent)
            messages.append({"role": "system", "content": f"Contexto da conversa:\n{context['history_str']}"})
        
        messages.append({"role": "user", "content": user_message})

        tokens_total = 0

        # --- AUTO RAG CHECK ---
        if await self._should_use_rag(user_message):
            try:
                # Check if search_knowledge_base is available/internal
                rag_results = await self.tools_registry.execute_tool("search_knowledge_base", query=user_message, client_id=context.get('client_id'))
                if rag_results:
                     system_prompt += f"\n\nINFORMAÇÕES RELEVANTES (RAG):\n{rag_results}\n"
            except Exception as e:
                print(f"[WARN] Auto-RAG failed: {e}")
        # --- END AUTO RAG ---

        try:
            # 3. Call OpenAI
            print(f"[DEBUG] Calling OpenAI with {len(tool_definitions)} tools: {[t['function']['name'] for t in tool_definitions]}")
            
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                tools=tool_definitions if tool_definitions else None,
                tool_choice="auto" if tool_definitions else None,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            response_message = response.choices[0].message
            tokens_total += response.usage.total_tokens

            print(f"[DEBUG] OpenAI finish_reason: {response.choices[0].finish_reason}")
            print(f"[DEBUG] Has tool_calls: {bool(response_message.tool_calls)}")
            
            # 4. Handle Response
            if response_message.tool_calls:
                # Append assistant message with tool calls
                messages.append(response_message)
                
                tool_call = response_message.tool_calls[0] # Handle primary tool call
                tool_name = tool_call.function.name
                try:
                    tool_args = json.loads(tool_call.function.arguments)
                except:
                    tool_args = {}
                
                # Setup Context (Client ID)
                if 'client_id' in context:
                    tool_args['client_id'] = context.get('client_id')

                # --- DATE NORMALIZATION ---
                if tool_name in ["disponibilidade", "check_availability", "reservar"]:
                    for key in ["data_inicio", "data_fim", "checkin", "checkout", "date"]:
                        if key in tool_args:
                            tool_args[key] = self._normalize_date(tool_args[key])
                # --------------------------

                print(f"[DEBUG] Tool selected: {tool_name}, Args: {tool_args}")

                # A. Internal Tool -> Execute & Loop
                if tool_name in self.INTERNAL_TOOLS:
                    print(f"[DEBUG] Executing internal tool: {tool_name}")
                    
                    # Execute via Registry
                    tool_output = await self.tools_registry.execute_tool(tool_name, **tool_args)
                    
                    # Append result
                    messages.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": tool_name,
                        "content": str(tool_output)
                    })
                    
                # Recurse (Second Call)
                    print(f"[DEBUG] Recursively calling OpenAI with tool result...")
                    final_response = await client.chat.completions.create(
                        model=model,
                        messages=messages,
                        tools=tool_definitions if tool_definitions else None, # Keep tools available? Usually yes.
                        temperature=temperature,
                        max_tokens=max_tokens
                    )
                    tokens_total += final_response.usage.total_tokens
                    
                    # Accumulate usage roughly (this is simplified as we executed twice)
                    # We should probably return the *last* response usage or sum them?
                    # For simplicity, returning the total accumulated so far for total, 
                    # but for breakdown, we might loose the first call's breakdown if we don't track it.
                    # Let's track cumulative for now if needed, but Orchestrator expects single call stats usually.
                    # Since we return a single "message", let's return the totals.
                    
                    # Note: response.usage from first call + final_response.usage
                    p_tokens = response.usage.prompt_tokens + final_response.usage.prompt_tokens
                    c_tokens = response.usage.completion_tokens + final_response.usage.completion_tokens

                    return {
                        "success": True,
                        "type": "message",
                        "response": final_response.choices[0].message.content,
                        "tokens_used": tokens_total,
                        "prompt_tokens": p_tokens,
                        "completion_tokens": c_tokens
                    }

                # B. External Tool -> Return Payload for N8N
                else:
                    print(f"[DEBUG] Returning tool_call for external execution: {tool_name}")
                    import uuid
                    return {
                        "success": True, # Wrapper expects success field
                        "type": "tool_call",
                        "tool_name": tool_name,
                        "tool_params": tool_args,
                        "tool_call_id": tool_call.id,
                        "context_id": str(uuid.uuid4()), # Unique ID for this suspension
                        "messages": messages, # Save state
                        "tokens_used": tokens_total,
                        "prompt_tokens": response.usage.prompt_tokens,
                        "completion_tokens": response.usage.completion_tokens
                    }

            # 5. No Tool Call -> Return Message
            print(f"[DEBUG] No tool call, returning direct message")
            return {
                "success": True,
                "type": "message",
                "response": response_message.content,
                "tokens_used": tokens_total,
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens
            }

        except Exception as e:
            print(f"[ERROR] AgentEngine error: {str(e)}")
            return {"success": False, "error": f"Error in AgentEngine: {str(e)}"}

    async def resume(self, messages: list, tool_call_id: str, tool_name: str, tool_result: dict, openai_api_key: str, model: str = 'gpt-4o-mini', temperature: float = 0.7, max_tokens: int = 1000):
        """
        Resume execution after an external tool result is received.
        """
        if not openai_api_key:
             return {"success": False, "error": "OpenAI API Key provided is empty"}

        client = AsyncOpenAI(api_key=openai_api_key)
        
        # Add the tool result to messages
        messages.append({
            "tool_call_id": tool_call_id,
            "role": "tool",
            "name": tool_name,
            "content": json.dumps(tool_result) # OpenAI expects string for tool content
        })
        
        try:
             # Follow up call to LLM
            final_response = await client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return {
                "success": True,
                "type": "message",
                "response": final_response.choices[0].message.content,
                "tokens_used": final_response.usage.total_tokens,
                "prompt_tokens": final_response.usage.prompt_tokens,
                "completion_tokens": final_response.usage.completion_tokens
            }
        except Exception as e:
            return {"success": False, "error": f"OpenAI Error on resume: {str(e)}"}
