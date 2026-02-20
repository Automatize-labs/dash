'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Trash2, Code, Terminal } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Tool {
    name: string
    description: string
    parameters: any // JSON Schema object
}

interface Props {
    clientId: string
    config: any
}

export default function ToolsManager({ clientId, config }: Props) {
    const router = useRouter()
    const [tools, setTools] = useState<Tool[]>(config?.enabled_tools || [])

    const [showDialog, setShowDialog] = useState(false)
    const [newTool, setNewTool] = useState<Tool>({
        name: '',
        description: '',
        parameters: {}
    })
    const [jsonError, setJsonError] = useState('')

    useEffect(() => {
        if (config?.enabled_tools) {
            setTools(config.enabled_tools)
        }
    }, [config])

    const handleAddTool = () => {
        if (!newTool.name || !newTool.description) {
            toast.error('Nome e descrição são obrigatórios')
            return
        }

        setTools([...tools, newTool])
        setNewTool({ name: '', description: '', parameters: {} })
        setShowDialog(false)
        toast.success('Tool adicionada! Não esqueça de salvar.')
    }

    const handleRemoveTool = (index: number) => {
        setTools(tools.filter((_, i) => i !== index))
        toast.success('Tool removida! Não esqueça de salvar.')
    }

    const handleSave = async () => {
        try {
            const { error } = await supabase
                .from('agent_configs')
                .update({
                    enabled_tools: tools,
                    updated_at: new Date().toISOString(),
                })
                .eq('client_id', clientId)

            if (error) throw error

            toast.success('Tools salvas com sucesso!')
            router.refresh()
            window.location.reload()
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar')
        }
    }

    return (
        <Card className="glass-card border-none">
            <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl text-white">Tools Externas</CardTitle>
                        <p className="text-sm text-slate-400 mt-1">
                            Configure integrações via N8N. Defina apenas a interface (parâmetros).
                        </p>
                    </div>
                    <Dialog open={showDialog} onOpenChange={setShowDialog}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 transition-transform text-white border-0">
                                <Plus className="mr-2" size={16} />
                                Nova Tool
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl glass-panel border-white/10 text-white">
                            <DialogHeader>
                                <DialogTitle className="text-white">Adicionar Tool Externa</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="tool_name" className="text-slate-200">Nome da Tool *</Label>
                                    <Input
                                        id="tool_name"
                                        value={newTool.name}
                                        onChange={(e) =>
                                            setNewTool({ ...newTool, name: e.target.value })
                                        }
                                        placeholder="Ex: disponibilidade"
                                        className="input-premium font-mono"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="tool_description" className="text-slate-200">Descrição *</Label>
                                    <Textarea
                                        id="tool_description"
                                        value={newTool.description}
                                        onChange={(e) =>
                                            setNewTool({ ...newTool, description: e.target.value })
                                        }
                                        placeholder="Ex: Verifica disponibilidade de quartos"
                                        rows={2}
                                        className="bg-white/5 border-white/10 text-slate-200 focus:border-blue-500/50"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="tool_params" className="text-slate-200">Parâmetros (JSON Schema) *</Label>
                                    <Textarea
                                        id="tool_params"
                                        defaultValue={JSON.stringify(newTool.parameters, null, 2)}
                                        onChange={(e) => {
                                            try {
                                                const params = JSON.parse(e.target.value)
                                                setNewTool({ ...newTool, parameters: params })
                                                setJsonError('')
                                            } catch (err) {
                                                setJsonError('JSON inválido')
                                            }
                                        }}
                                        rows={10}
                                        className="font-mono text-sm bg-black/40 border-white/10 text-slate-300"
                                        placeholder={`{
  "type": "object",
  "properties": {
    "adultos": {
      "type": "string",
      "description": "Número de adultos"
    }
  },
  "required": ["adultos"]
}`}
                                    />
                                    {jsonError && <p className="text-xs text-red-500 mt-1">{jsonError}</p>}
                                    <p className="text-xs text-slate-500 mt-1">
                                        Formato OpenAI Function Calling.
                                    </p>
                                </div>

                                <div className="bg-blue-500/10 p-4 rounded border border-blue-500/20">
                                    <p className="text-sm font-medium text-blue-300 mb-2">
                                        ℹ️ Configuração no N8N:
                                    </p>
                                    <p className="text-xs text-blue-200/70">
                                        O comando CURL ou HTTP Request deve ser configurado no workflow do N8N.
                                        O agente apenas identificará a intenção e extrairá os parâmetros definidos acima.
                                    </p>
                                </div>

                                <div className="flex gap-2 justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowDialog(false)}
                                        className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button onClick={handleAddTool} disabled={!!jsonError} className="bg-blue-600 hover:bg-blue-700">Adicionar Tool</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {tools.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                        <Terminal size={48} className="mx-auto mb-4 text-slate-600" />
                        <p className="text-slate-400">Nenhuma tool configurada ainda</p>
                        <p className="text-sm text-slate-600 mt-1">
                            Clique em "Nova Tool" para adicionar integrações
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid gap-4">
                            {tools.map((tool, index) => (
                                <Card key={index} className="bg-white/5 border border-white/10 group hover:bg-white/10 transition-colors">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
                                                    <Terminal size={18} className="text-purple-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-white">{tool.name}</h3>
                                                    <p className="text-sm text-slate-400 mt-0.5">{tool.description}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveTool(index)}
                                                className="text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                            >
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>
                                        <div className="bg-black/40 text-slate-300 p-4 rounded-lg border border-white/5 font-mono text-xs overflow-x-auto">
                                            <pre>
                                                {JSON.stringify(tool.parameters, null, 2)}
                                            </pre>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSave} className="h-12 px-8 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform">
                                Salvar Todas as Tools
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
