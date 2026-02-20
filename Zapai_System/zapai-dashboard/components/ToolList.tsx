'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, Edit, Plus, Code } from 'lucide-react'

export interface Tool {
    name: string
    description: string
    parameters: string // JSON string
}

interface Props {
    tools: Tool[]
    onChange: (tools: Tool[]) => void
}

export default function ToolList({ tools, onChange }: Props) {
    const [open, setOpen] = useState(false)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [currentTool, setCurrentTool] = useState<Tool>({ name: '', description: '', parameters: '{}' })

    const handleSave = () => {
        const newTools = [...tools]
        if (editingIndex !== null) {
            newTools[editingIndex] = currentTool
        } else {
            newTools.push(currentTool)
        }
        onChange(newTools)
        setOpen(false)
        setEditingIndex(null)
        setCurrentTool({ name: '', description: '', parameters: '{}' })
    }

    const handleEdit = (index: number) => {
        setEditingIndex(index)
        setCurrentTool(tools[index])
        setOpen(true)
    }

    const handleDelete = (index: number) => {
        const newTools = tools.filter((_, i) => i !== index)
        onChange(newTools)
    }

    const handleAddNew = () => {
        setEditingIndex(null)
        setCurrentTool({ name: '', description: '', parameters: '{\n  "type": "object",\n  "properties": {\n    "param1": { "type": "string" }\n  }\n}' })
        setOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Label className="text-slate-200">Ferramentas (Tools)</Label>
                <Button variant="outline" size="sm" onClick={handleAddNew} className="bg-white/5 border-white/10 hover:bg-white/10 text-slate-200">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar
                </Button>
            </div>

            <div className="grid gap-3">
                {tools.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-xl bg-white/5">
                        <p className="text-slate-500 text-sm">Nenhuma ferramenta configurada</p>
                    </div>
                )}
                {tools.map((tool, index) => (
                    <Card key={index} className="bg-white/5 border border-white/10 relative group hover:bg-white/10 transition-colors">
                        <CardContent className="p-4 flex justify-between items-center">
                            <div className="flex-1 min-w-0 mr-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Code size={14} className="text-purple-400 shrink-0" />
                                    <h4 className="font-medium font-mono text-sm text-blue-200 truncate">{tool.name}</h4>
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-1">{tool.description}</p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(index)} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10">
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(index)} className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[600px] glass-panel border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white">{editingIndex !== null ? 'Editar Tool' : 'Nova Tool'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-slate-200">Nome (Função)</Label>
                            <Input
                                value={currentTool.name}
                                onChange={e => setCurrentTool({ ...currentTool, name: e.target.value })}
                                placeholder="ex: buscar_estoque"
                                className="input-premium font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-200">Descrição</Label>
                            <Textarea
                                value={currentTool.description}
                                onChange={e => setCurrentTool({ ...currentTool, description: e.target.value })}
                                placeholder="O que esta ferramenta faz?"
                                className="bg-white/5 border-white/10 text-slate-200 focus:border-blue-500/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-200">Parâmetros (JSON Schema)</Label>
                            <Textarea
                                value={currentTool.parameters}
                                onChange={e => setCurrentTool({ ...currentTool, parameters: e.target.value })}
                                className="font-mono text-xs h-64 bg-black/40 border-white/10 text-slate-300"
                                placeholder='{ "type": "object", ... }'
                            />
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSave} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">Salvar Tool</Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
