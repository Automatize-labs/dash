'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getAgentConfig, updateAgentConfig } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Trash2, Plus, Save, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Rule {
    value: number
    unit: string
}

export default function SettingsPage() {
    const params = useParams()
    const clientId = typeof params?.client_id === 'string' ? params.client_id : ''

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [webhook, setWebhook] = useState('')
    const [enabled, setEnabled] = useState(false)
    const [rules, setRules] = useState<Rule[]>([])

    useEffect(() => {
        if (clientId) {
            getAgentConfig(clientId).then(data => {
                if (data.error) {
                    toast.error('Falha ao carregar configurações')
                } else {
                    setWebhook(data.followup_webhook || '')
                    setEnabled(data.followup_enabled || false)
                    // Normalize rules if they come in different formats
                    const loadedRules = Array.isArray(data.followup_rules) ? data.followup_rules : []
                    // Ensure structure
                    setRules(loadedRules.map((r: any) => ({
                        value: r.value || r || 0,
                        unit: r.unit || 'minutes'
                    })))
                }
                setLoading(false)
            })
        }
    }, [clientId])

    const handleSave = async () => {
        setSaving(true)
        const result = await updateAgentConfig(clientId, {
            webhook,
            rules,
            enabled
        })

        if (result.error) {
            toast.error(`Erro: ${result.error}`)
        } else {
            toast.success('Configurações salvas com sucesso!')
        }
        setSaving(false)
    }

    const addRule = () => {
        setRules([...rules, { value: 15, unit: 'minutes' }])
    }

    const removeRule = (index: number) => {
        setRules(rules.filter((_, i) => i !== index))
    }

    const updateRule = (index: number, field: keyof Rule, value: any) => {
        const newRules = [...rules]
        newRules[index] = { ...newRules[index], [field]: value }
        setRules(newRules)
    }

    if (loading) return <div className="p-8 text-white">Carregando configurações...</div>

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Estratégia de Follow-up 🚀</h1>
                    <p className="text-slate-400">Configure quando o sistema deve avisar sobre leads inativos.</p>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                    <span className="text-sm font-medium text-slate-300">Sistema Ativo?</span>
                    <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>
            </div>

            <Card className="bg-white/5 border-white/10 text-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="text-blue-400" />
                        Webhook de Disparo
                    </CardTitle>
                    <CardDescription>
                        URL do workflow no n8n que receberá o aviso de inatividade.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="https://seu-n8n.com/webhook/..."
                            value={webhook}
                            onChange={(e) => setWebhook(e.target.value)}
                            className="bg-black/20 border-white/10 text-white"
                        />
                        <Button
                            variant="secondary"
                            onClick={async () => {
                                if (!webhook) return toast.error('Preencha a URL primeiro')
                                toast.info('Enviando teste...')
                                const { testWebhook } = await import('./actions')
                                const res = await testWebhook(webhook, clientId)
                                if (res.error) toast.error(`Falha: ${res.error}`)
                                else toast.success('Teste enviado com sucesso! Verifique o n8n.')
                            }}
                            className="shrink-0"
                        >
                            ⚡ Testar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 text-white">
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>Regras de Tempo</CardTitle>
                        <CardDescription>Defina quanto tempo de silêncio (após mensagem da IA) dispara o aviso.</CardDescription>
                    </div>
                    <Button onClick={addRule} variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                        <Plus size={16} className="mr-2" /> Nova Regra
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {rules.length === 0 && (
                        <div className="text-center p-8 text-slate-500 border border-dashed border-white/10 rounded-xl">
                            Nenhuma regra configurada. Clique em "Nova Regra" para adicionar.
                        </div>
                    )}
                    {rules.map((rule, index) => (
                        <div key={index} className="flex gap-4 items-center bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 font-medium">Após</span>
                            </div>
                            <Input
                                type="number"
                                value={rule.value}
                                onChange={(e) => updateRule(index, 'value', parseInt(e.target.value))}
                                className="w-24 bg-black/40 border-white/10"
                            />
                            <Select
                                value={rule.unit}
                                onValueChange={(val) => updateRule(index, 'unit', val)}
                            >
                                <SelectTrigger className="w-32 bg-black/40 border-white/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                    <SelectItem value="minutes">Minutos</SelectItem>
                                    <SelectItem value="hours">Horas</SelectItem>
                                    <SelectItem value="days">Dias</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 font-medium">de inatividade</span>
                            </div>
                            <div className="flex-1"></div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeRule(index)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                                <Trash2 size={18} />
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg shadow-lg shadow-purple-900/20"
                >
                    {saving ? 'Salvando...' : (
                        <>
                            <Save className="mr-2" /> Salvar Configurações
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
