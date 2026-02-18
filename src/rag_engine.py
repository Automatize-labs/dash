from .database import SupabaseClient
import os

class RAGEngine:
    def __init__(self, db_client: SupabaseClient):
        self.db = db_client

    async def search(self, query: str, client_id: str, top_k: int = 3):
        """
        Busca em knowledge_base filtrando por client_id.
        Usa ILIKE para buscar em title e content (Busca Simples por enquanto).
        """
        try:
            # Supabase-py 'like' allows simple pattern matching
            # logic: title ilike %query% OR content ilike %query%
            # The client library might limit OR queries, let's try a simple approach or rpc if needed.
            # Using 'or' filter string format: "title.ilike.%query%,content.ilike.%query%"
            
            # PostgREST syntax for OR is (col.op.val,col.op.val)
            # filter = f"title.ilike.%{query}%,content.ilike.%{query}%" -- this implies OR? 
            # Actually standard 'or' usage: .or_("title.ilike.%q%,content.ilike.%q%")
            
            # Note: embeddings are better, but for now we follow instructions for simple text search.
            
            pattern = f"%{query}%"
            res = self.db.client.table("knowledge_base")\
                .select("*")\
                .eq("client_id", client_id)\
                .or_(f"title.ilike.{pattern},content.ilike.{pattern}")\
                .limit(top_k)\
                .execute()
                
            if res.data:
                results = []
                for item in res.data:
                    results.append(f"Título: {item['title']}\nConteúdo: {item['content']}")
                return results
            return []
        except Exception as e:
            print(f"RAG Search Error: {e}")
            return []
