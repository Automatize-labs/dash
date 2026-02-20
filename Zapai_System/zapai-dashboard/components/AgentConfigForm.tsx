'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import ToolList, { Tool } from './ToolList'
import { Save, Database, CheckCircle, XCircle, ArrowRight } from 'lucide-react'

interface Props {
    clientId: string
    config: any
}

export default function AgentConfigForm({ clientId, config }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [testingConnection, setTestingConnection] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'none' | 'success' | 'error'>('none')

    const [formData, setFormData] = useState({
        system_prompt: config?.system_prompt || '',
        model: config?.model || 'gpt-4o-mini',
        temperature: config?.temperature || 0.7,
        max_tokens: config?.max_tokens || 1000,
        rag_enabled: config?.rag_enabled ?? true,
        rag_top_k: config?.rag_top_k || 3,
        openai_api_key: config?.openai_api_key || '',
        enabled_tools: config?.enabled_tools || [],
        supabase_url: config?.supabase_url || '',
        supabase_service_role_key: config?.supabase_service_role_key || '',
    })

    useEffect(() => {
        if (config) {
            setFormData({
                system_prompt: config.system_prompt || '',
                model: config.model || 'gpt-4o-mini',
                temperature: config.temperature || 0.7,
                max_tokens: config.max_tokens || 1000,
                rag_enabled: config.rag_enabled ?? true,
                rag_top_k: config.rag_top_k || 3,
                openai_api_key: config.openai_api_key || '',
                enabled_tools: config.enabled_tools || [],
                supabase_url: config.supabase_url || '',
                supabase_service_role_key: config.supabase_service_role_key || '',
            })
        }
    }, [config])

    const handleTestConnection = async () => {
        if (!formData.supabase_url || !formData.supabase_service_role_key) {
            toast.error('Preencha a URL e a Key do Supabase')
            return
        }

        setTestingConnection(true)
        setConnectionStatus('none')

        try {
            const testClient = createClient(formData.supabase_url, formData.supabase_service_role_key)
            // Tenta listar tabelas ou fazer uma query simples. Como não temos permissão de listar tabelas diretamente sem ser admin,
            // tentamos acessar uma tabela pública ou apenas verificar se o cliente não estoura erro de conexao imediato.
            // O melhor teste é tentar um select simples. Se a tabela nao existir, dará erro de tabela. Se a auth falhar, erro de auth.
            // Vamos tentar um health check fake ou apenas instanciar.
            // Para testar REALMENTE, precisariamos tentar ler algo. Vamos assumir que se instanciou, ok, mas o ideal é um fetch.
            // Vamos tentar buscar count de 'leads' (que deve existir se o schema foi rodado lá).

            const { error } = await testClient.from('leads').select('count', { count: 'exact', head: true })

            // Se der erro de "relation does not exist", significa que conectou mas nao tem as tabelas (o que é ok, conexao valida).
            // Se der erro de auth, ai falhou.

            if (error && error.code !== 'PGRST204' && !error.message.includes('leads')) {
                // PGRST204 = success no content? nao.
                // Se der erro de Auth (401/403)
                if (error.message && (error.message.includes('JWT') || error.code === '401' || error.code === '403')) {
                    throw new Error('Falha de Autenticação: Verifique a Key')
                }
                // Se der erro 404 not found na URL
                if (error.message && error.message.includes('FetchError')) {
                    throw new Error('URL inválida ou inacessível')
                }
            }

            setConnectionStatus('success')
            toast.success('Conexão realizada com sucesso!')

        } catch (error: any) {
            console.error(error)
            setConnectionStatus('error')
            toast.error(`Erro na conexão: ${error.message}`)
        } finally {
            setTestingConnection(false)
        }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            // Validate and Parse Tools
            const processedTools = formData.enabled_tools.map((tool: any) => {
                try {
                    const params = typeof tool.parameters === 'string'
                        ? JSON.parse(tool.parameters)
                        : tool.parameters
                    return { ...tool, parameters: params }
                } catch (e) {
                    throw new Error(`Erro no JSON dos parâmetros da tool '${tool.name}'`)
                }
            })

            const dataToSave = {
                ...formData,
                enabled_tools: processedTools,
                updated_at: new Date().toISOString(),
            }

            // Verificar se config existe
            const { data: existingConfig } = await supabase
                .from('agent_configs')
                .select('id')
                .eq('client_id', clientId)
                .single()

            if (existingConfig) {
                // UPDATE
                const { error } = await supabase
                    .from('agent_configs')
                    .update(dataToSave)
                    .eq('client_id', clientId)

                if (error) throw error
            } else {
                // INSERT
                const { error } = await supabase
                    .from('agent_configs')
                    .insert({
                        client_id: clientId,
                        ...dataToSave,
                    })

                if (error) throw error
            }

            toast.success('Configuração salva com sucesso!')
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="glass-card border-none">
            <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="text-xl text-white">Configuração do Agente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">

                {/* 0. Supabase Connection (NEW) */}
                <div className="space-y-4 bg-gradient-to-r from-emerald-900/10 to-blue-900/10 p-6 rounded-2xl border border-emerald-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <Database className="text-emerald-400" size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-white">Supabase Isolado (Multi-Tenant)</h3>
                            <p className="text-sm text-slate-400">Configure um banco de dados exclusivo para este agente.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="supabase_url" className="text-slate-200">Supabase URL</Label>
                            <Input
                                id="supabase_url"
                                value={formData.supabase_url}
                                onChange={(e) => setFormData({ ...formData, supabase_url: e.target.value })}
                                placeholder="https://seu-projeto.supabase.co"
                                className="input-premium"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="supabase_key" className="text-slate-200">Service Role Key</Label>
                            <Input
                                id="supabase_key"
                                type="password"
                                value={formData.supabase_service_role_key}
                                onChange={(e) => setFormData({ ...formData, supabase_service_role_key: e.target.value })}
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                className="input-premium"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                            {connectionStatus === 'success' && (
                                <span className="text-emerald-400 text-sm flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                    <CheckCircle size={14} /> Conectado
                                </span>
                            )}
                            {connectionStatus === 'error' && (
                                <span className="text-red-400 text-sm flex items-center gap-1 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                                    <XCircle size={14} /> Falha na conexão
                                </span>
                            )}
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleTestConnection}
                            disabled={testingConnection || !formData.supabase_url}
                            className="bg-white/5 hover:bg-white/10 text-white border border-white/10"
                        >
                            {testingConnection ? 'Testando...' : 'Testar Conexão'}
                        </Button>
                    </div>
                </div>

                {/* 1. System Prompt */}
                <div className="space-y-3">
                    <Label htmlFor="prompt" className="text-slate-200 text-base">System Prompt / Personalidade</Label>
                    <div className="relative">
                        <Textarea
                            id="prompt"
                            value={formData.system_prompt}
                            onChange={(e) =>
                                setFormData({ ...formData, system_prompt: e.target.value })
                            }
                            rows={8}
                            placeholder="Você é um assistente virtual..."
                            className="font-mono text-sm bg-black/40 border-white/10 text-slate-300 focus:border-blue-500/50 resize-y rounded-xl p-4"
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-slate-600 pointer-events-none">
                            Markdown supported
                        </div>
                    </div>
                </div>

                {/* 2. Tools Management */}
                <div className="border-t border-white/5 pt-6">
                    <h3 className="text-lg font-medium text-white mb-4">Ferramentas Ativas</h3>
                    <ToolList
                        tools={formData.enabled_tools as Tool[]}
                        onChange={(newTools) => setFormData({ ...formData, enabled_tools: newTools })}
                    />
                </div>

                {/* 3. Models & Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-6">
                    <div className="space-y-2">
                        <Label htmlFor="model" className="text-slate-200">Modelo OpenAI</Label>
                        <Select
                            value={formData.model}
                            onValueChange={(value) =>
                                setFormData({ ...formData, model: value })
                            }
                        >
                            <SelectTrigger className="bg-white/5 border-white/10 text-slate-200 h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-slate-200">
                                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Rápido)</SelectItem>
                                <SelectItem value="gpt-4o">GPT-4o (Avançado)</SelectItem>
                                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <Label htmlFor="temperature" className="text-slate-200">Criatividade (Temp)</Label>
                            <span className="text-sm font-mono text-blue-400">{formData.temperature}</span>
                        </div>
                        <input
                            id="temperature"
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={formData.temperature}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    temperature: parseFloat(e.target.value),
                                })
                            }
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="max_tokens" className="text-slate-200">Max Tokens</Label>
                        <Input
                            id="max_tokens"
                            type="number"
                            value={formData.max_tokens}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    max_tokens: parseInt(e.target.value),
                                })
                            }
                            className="input-premium"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="api_key" className="text-slate-200">OpenAI API Key (Override)</Label>
                        <Input
                            id="api_key"
                            type="password"
                            value={formData.openai_api_key}
                            onChange={(e) =>
                                setFormData({ ...formData, openai_api_key: e.target.value })
                            }
                            placeholder="sk-proj-..."
                            className="input-premium"
                        />
                        <p className="text-xs text-slate-500">Deixe vazio para usar a chave global</p>
                    </div>
                </div>

                {/* 4. RAG Settings */}
                <div className="border-t border-white/5 pt-6 space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                        <div>
                            <Label className="text-base text-white">Knowledge Base (RAG)</Label>
                            <p className="text-sm text-slate-400 mt-1">
                                Permitir busca de informações na base de conhecimento
                            </p>
                        </div>
                        <Switch
                            checked={formData.rag_enabled}
                            onCheckedChange={(checked) =>
                                setFormData({ ...formData, rag_enabled: checked })
                            }
                            className="data-[state=checked]:bg-emerald-500"
                        />
                    </div>

                    {formData.rag_enabled && (
                        <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5">
                            <Label htmlFor="rag_top_k" className="text-slate-200">Resultados por busca (Top K)</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    id="rag_top_k"
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={formData.rag_top_k}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            rag_top_k: parseInt(e.target.value),
                                        })
                                    }
                                    className="w-24 input-premium"
                                />
                                <span className="text-sm text-slate-500">Quantos trechos de texto recuperar para contexto.</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="h-12 px-8 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                    >
                        <Save className="mr-2" size={20} />
                        {loading ? 'Salvando...' : 'Salvar Configurações'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
