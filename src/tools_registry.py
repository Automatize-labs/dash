from typing import List, Dict, Any, Callable
import json
from .database import SupabaseClient

class ToolsRegistry:
    def __init__(self, db_client: SupabaseClient):
        self.db = db_client
        self.dynamic_tool_map = {}

    async def get_conversation_history(self, lead_phone: str, client_id: str, limit: int = 10) -> str:
        """Busca histórico da conversa"""
        # Need lead_id first.
        lead = await self.db.get_or_create_lead(client_id, lead_phone)
        if not lead:
            return "Lead não encontrado."
            
        history = await self.db.get_conversation_history(client_id, lead['id'], limit)
        if not history:
            return "Nenhum histórico encontrado."
            
        formatted = []
        for msg in history:
            role = msg['role']
            content = msg['content']
            formatted.append(f"{role}: {content}")
        return "\n".join(formatted)

    async def search_knowledge_base(self, query: str, client_id: str, top_k: int = 3) -> str:
        """Busca na base de conhecimento (Wrapper para RAGEngine será injetado ou lógica aqui)"""
        # For simplicity, we can import RAG here or implement simple query.
        # Since we have RAGEngine created, let's use it dynamically or implement simple logic here to avoid circular deps if RAG uses tools.
        # Actually RAG engine is standalone.
        from .rag_engine import RAGEngine
        rag = RAGEngine(self.db)
        results = await rag.search(query, client_id, top_k)
        if not results:
            return "Nenhuma informação relevante encontrada na base de conhecimento."
        return "\n\n".join(results)

    async def analyze_lead_profile(self, lead_phone: str, client_id: str) -> str:
        """Retorna dados do lead"""
        lead = await self.db.get_or_create_lead(client_id, lead_phone)
        if not lead:
            return "Lead não encontrado."
        
        # We could fetch more data or summarizing past interactions
        return json.dumps(lead, indent=2, default=str)

    def get_tool_definitions(self, dynamic_tools: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Converte lista de tools para formato OpenAI Function Calling
        """
        internal_tools = [
            {
                "type": "function",
                "function": {
                    "name": "get_conversation_history",
                    "description": "Recupera o histórico recente de mensagens da conversa com o cliente para entender o contexto.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "lead_phone": {"type": "string", "description": "Telefone do lead"},
                            "client_id": {"type": "string"},
                            "limit": {"type": "integer", "description": "Número de mensagens a buscar"}
                        },
                        "required": ["lead_phone", "client_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "search_knowledge_base",
                    "description": "Busca informações na base de conhecimento da empresa sobre produtos, serviços, horários, etc.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                             "query": {"type": "string", "description": "Termo de busca"},
                             "client_id": {"type": "string"},
                             "top_k": {"type": "integer"}
                        },
                        "required": ["query", "client_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "analyze_lead_profile",
                    "description": "Busca dados cadastrais e perfil do lead.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "lead_phone": {"type": "string"},
                            "client_id": {"type": "string"}
                        },
                        "required": ["lead_phone", "client_id"]
                    }
                }
            }
        ]
        
        # Parse dynamic tools from config
        self.dynamic_tool_map = {} # Store for execution (or identification)
        if dynamic_tools:
            for tool in dynamic_tools:
                if not isinstance(tool, dict): continue
                
                name = tool.get('name')
                description = tool.get('description', '')
                parameters = tool.get('parameters')
                
                if not name: continue
                
                self.dynamic_tool_map[name] = tool
                
                # Use provided parameters (JSON Schema)
                if parameters:
                    definition = {
                        "type": "function",
                        "function": {
                            "name": name,
                            "description": description,
                            "parameters": parameters
                        }
                    }
                    internal_tools.append(definition)
        
        return internal_tools

    def is_internal_tool(self, tool_name: str) -> bool:
        internal_names = ["get_conversation_history", "search_knowledge_base", "analyze_lead_profile"]
        if tool_name in internal_names:
            return True
        return tool_name in getattr(self, 'dynamic_tool_map', {})

    async def execute_tool(self, tool_name: str, **kwargs) -> str:
        if tool_name == "get_conversation_history":
            return await self.get_conversation_history(**kwargs)
        elif tool_name == "search_knowledge_base":
            return await self.search_knowledge_base(**kwargs)
        elif tool_name == "analyze_lead_profile":
            return await self.analyze_lead_profile(**kwargs)
        # Dynamic tools are now handled as external tools by AgentEngine
        # So we don't execute them here.
        # elif hasattr(self, 'dynamic_tool_map') and tool_name in self.dynamic_tool_map:
        #     return await self.execute_dynamic_tool(tool_name, **kwargs)
        else:
            return f"Erro: Tool {tool_name} não encontrada ou é externa."


