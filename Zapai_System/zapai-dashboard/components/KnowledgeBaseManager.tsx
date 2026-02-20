'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Trash2, FileText, UploadCloud, Search, Database } from 'lucide-react'

interface KnowledgeDoc {
    id: string
    title: string
    content: string
    category: string | null
    created_at: string
}

export default function KnowledgeBaseManager({
    clientId,
}: {
    clientId: string
}) {
    const [docs, setDocs] = useState<KnowledgeDoc[]>([])
    const [loading, setLoading] = useState(true)
    const [showDialog, setShowDialog] = useState(false)
    const [usingIsolatedDb, setUsingIsolatedDb] = useState(false)
    const [targetConfig, setTargetConfig] = useState<any>(null)

    // Store credentials for dynamic client if needed

    const [newDoc, setNewDoc] = useState({
        title: '',
        content: '',
        category: '',
    })

    useEffect(() => {
        loadDocs()
    }, [clientId])

    const getTargetClient = () => {
        if (targetConfig?.supabase_url && targetConfig?.supabase_service_role_key) {
            return createClient(targetConfig.supabase_url, targetConfig.supabase_service_role_key)
        }
        return supabase
    }

    const loadDocs = async () => {
        setLoading(true)

        // 1. Get Agent Config
        const { data: config } = await supabase
            .from('agent_configs')
            .select('*')
            .eq('client_id', clientId)
            .single()

        setTargetConfig(config)

        let clientToUse = supabase
        let filterClientId = true // Usually true, but if using isolated DB, maybe not needed if messages don't have client_id? 
        // knowledge_base table schema? 
        // Setup schema said: CREATE TABLE knowledge_base ( ... no client_id? )
        // Wait. `setup_db_direct.py` content check again:
        /*
        CREATE TABLE IF NOT EXISTS knowledge_base (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT,
            content TEXT NOT NULL,
            metadata JSONB DEFAULT '{}',
            embedding VECTOR(1536),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        */
        // IT DOES NOT HAVE client_id !!!
        // If it doesn't have client_id, then `KnowledgeBaseManager` using `.eq('client_id', clientId)` was FAILING all along?
        // Or did I miss it?
        // The previous code had `.eq('client_id', clientId)`.
        // If the table doesn't have the column, Supabase throws error.
        // Maybe the user added it manually? Or I missed it in the file view?
        // Let's assume for Isolated DB, we don't need client_id filter if the DB is dedicated.
        // But for Shared DB (Admin), we DO need it.
        // If the table in Admin DB doesn't have client_id, then RAG was broken for shared DB too.
        // Unless `metadata` contains client_id? No, `.eq('client_id', ...)` targets a column.

        // Strategy:
        // For Isolated DB: Don't filter by client_id (since whole DB is theirs).
        // For Shared DB: Try to filter, catch error?

        if (config?.supabase_url && config?.supabase_service_role_key) {
            clientToUse = createClient(config.supabase_url, config.supabase_service_role_key)
            setUsingIsolatedDb(true)
            filterClientId = false // Isolated DB, assume all docs are for this agent
            // Unless the user wants to support multiple agents in HIS Supabase? 
            // Better to add client_id if possible, but if column missing, we skip.
        } else {
            setUsingIsolatedDb(false)
            filterClientId = true
        }

        let query = clientToUse
            .from('knowledge_base')
            .select('*')
            .order('created_at', { ascending: false })

        if (filterClientId) {
            // Try to filter. If column missing, it will error.
            // We can check if we should suppress error?
            query = query.eq('client_id', clientId) // Optimistic
        }

        const { data, error } = await query

        if (error) {
            console.error("Error loading docs:", error)
            // If error is about missing column client_id, and we are in isolated DB, retry without it?
            if (usingIsolatedDb && (error.code === '42703' || error.message.includes('column'))) { // Undefined column
                const { data: retryData } = await clientToUse
                    .from('knowledge_base')
                    .select('*')
                    .order('created_at', { ascending: false })
                setDocs(retryData || [])
            } else {
                toast.error("Erro ao carregar documentos. Verifique a conexão.")
            }
        } else {
            setDocs(data || [])
        }

        setLoading(false)
    }

    const handleAdd = async () => {
        if (!newDoc.title || !newDoc.content) {
            toast.error('Título e conteúdo são obrigatórios')
            return
        }

        const clientToUse = getTargetClient()

        // Prepare insert payload
        // If we are in Shared DB, we MUST send client_id.
        // If in Isolated DB, we MIGHT NOT need it if column doesn't exist.
        // But best practice is to send it if column exists.
        // We will try sending it. If it fails due to column missing, we retry without it.

        const payloadWithId = {
            client_id: clientId,
            ...newDoc,
        }

        const payloadWithoutId = {
            ...newDoc
        }

        let { error } = await clientToUse.from('knowledge_base').insert([payloadWithId])

        if (error) {
            // Retrocompatibility/Schema Check
            if (usingIsolatedDb && (error.code === '42703' || error.message.includes('column'))) {
                const { error: retryError } = await clientToUse.from('knowledge_base').insert([payloadWithoutId])
                if (retryError) {
                    toast.error(retryError.message)
                    return
                }
            } else {
                toast.error(error.message)
                return
            }
        }

        toast.success('Documento adicionado!')
        setNewDoc({ title: '', content: '', category: '' })
        setShowDialog(false)
        loadDocs()
    }

    const handleDelete = async (id: string) => {
        const clientToUse = getTargetClient()
        const { error } = await clientToUse
            .from('knowledge_base')
            .delete()
            .eq('id', id)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Documento removido!')
            loadDocs()
        }
    }

    return (
        <Card className="glass-card border-none">
            <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl text-white">Knowledge Base (RAG)</CardTitle>
                        <p className="text-sm text-slate-400 mt-1">
                            Gerencie os documentos que alimentam a inteligência do seu agente.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {usingIsolatedDb && (
                            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                                <Database size={12} fill="currentColor" /> Supabase Isolado
                            </span>
                        )}
                        <Dialog open={showDialog} onOpenChange={setShowDialog}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 border-0">
                                    <Plus className="mr-2" size={16} />
                                    Novo Documento
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl glass-panel border-white/10 text-white">
                                <DialogHeader>
                                    <DialogTitle className="text-white">Adicionar Documento</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div>
                                        <Label htmlFor="doc_title" className="text-slate-200">Título *</Label>
                                        <Input
                                            id="doc_title"
                                            value={newDoc.title}
                                            onChange={(e) =>
                                                setNewDoc({ ...newDoc, title: e.target.value })
                                            }
                                            placeholder="Ex: Horário de Atendimento"
                                            className="input-premium"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="doc_category" className="text-slate-200">Categoria (opcional)</Label>
                                        <Input
                                            id="doc_category"
                                            value={newDoc.category}
                                            onChange={(e) =>
                                                setNewDoc({ ...newDoc, category: e.target.value })
                                            }
                                            placeholder="Ex: FAQ, Políticas, Produtos"
                                            className="input-premium"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="doc_content" className="text-slate-200">Conteúdo *</Label>
                                        <Textarea
                                            id="doc_content"
                                            value={newDoc.content}
                                            onChange={(e) =>
                                                setNewDoc({ ...newDoc, content: e.target.value })
                                            }
                                            placeholder="Cole aqui o conteúdo do documento..."
                                            rows={10}
                                            className="bg-black/40 border-white/10 text-slate-300 focus:border-emerald-500/50 resize-y rounded-xl p-4"
                                        />
                                    </div>

                                    <div className="flex gap-2 justify-end pt-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowDialog(false)}
                                            className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
                                        >
                                            Cancelar
                                        </Button>
                                        <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">Adicionar</Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {/* Search Bar - Visual Only for now */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <Input
                        placeholder="Buscar documentos..."
                        className="pl-10 bg-white/5 border-white/10 text-slate-200 focus:bg-white/10"
                    />
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-8 h-8 boundary-t-2 border-emerald-500 rounded-full mx-auto mb-4" />
                        <p className="text-slate-400">Carregando base de conhecimento...</p>
                    </div>
                ) : docs.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-white/5 mx-auto max-w-lg">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UploadCloud size={32} className="text-slate-500" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">Base vazia</h3>
                        <p className="text-slate-400 max-w-xs mx-auto mb-6">
                            Adicione documentos de texto para treinar seu agente com informações específicas do negócio.
                        </p>
                        <Button onClick={() => setShowDialog(true)} variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                            Adicionar Primeiro Documento
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {docs.map((doc) => (
                            <Card key={doc.id} className="bg-white/5 border border-white/10 group hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                                    <FileText size={18} className="text-emerald-400" />
                                                </div>
                                                <h3 className="font-semibold text-white truncate">{doc.title}</h3>
                                            </div>

                                            {doc.category && (
                                                <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-medium mb-3 inline-block">
                                                    {doc.category}
                                                </span>
                                            )}

                                            <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                                                {doc.content}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(doc.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-slate-500">
                                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                                        <span>{doc.content.length} caracteres</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
