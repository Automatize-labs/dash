'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export default function NovoClientePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        client_id: '',
        industry: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // 1. Tentar criar ou buscar cliente
            let clientData

            // Primeiro tenta buscar para garantir id
            const { data: existingClient } = await supabase
                .from('clients')
                .select()
                .eq('client_id', formData.client_id)
                .single()

            if (existingClient) {
                clientData = existingClient
                toast.info('Cliente já existe, configurando agente...')
            } else {
                const { data: newClient, error: clientError } = await supabase
                    .from('clients')
                    .insert([
                        {
                            client_id: formData.client_id,
                            name: formData.name,
                            industry: formData.industry || null,
                            active: true,
                        },
                    ])
                    .select()
                    .single()

                if (clientError) throw clientError
                clientData = newClient
            }

            if (!clientData) throw new Error('Falha ao obter dados do cliente')

            console.log("DEBUG: clientData", clientData)
            console.log("DEBUG: formData.client_id", formData.client_id)
            console.log("DEBUG: Inserting into agent_configs with client_id:", clientData.client_id)

            // 2. Criar ou Atualizar Configuração do Agente
            const { error: configError } = await supabase
                .from('agent_configs')
                .upsert([ // Usar upsert para evitar erro de chave duplicada
                    {
                        client_id: clientData.client_id, // Use the Text ID (slug), NOT the UUID
                        system_prompt: 'Você é um assistente virtual profissional e prestativo.',
                        model: 'gpt-4o-mini',
                        temperature: 0.7,
                        max_tokens: 1000,
                        enabled_tools: [],
                        rag_enabled: true,
                        rag_top_k: 3,
                        active: true,
                    },
                ], { onConflict: 'client_id' })

            if (configError) throw configError

            toast.success(existingClient ? 'Agente configurado!' : 'Cliente criado com sucesso!')
            router.push(`/dashboard/${formData.client_id}`)
        } catch (error: any) {
            toast.error(error.message || 'Erro ao criar cliente')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Novo Cliente</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Informações Básicas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="name">Nome da Empresa *</Label>
                                <Input
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="Ex: Imobiliária ABC"
                                />
                            </div>

                            <div>
                                <Label htmlFor="client_id">Client ID * (único)</Label>
                                <Input
                                    id="client_id"
                                    required
                                    value={formData.client_id}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            client_id: e.target.value
                                                .toLowerCase()
                                                .replace(/[^a-z0-9_-]/g, ''),
                                        })
                                    }
                                    placeholder="Ex: imobiliaria_abc"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Apenas letras, números, _ e -
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="industry">Segmento (opcional)</Label>
                                <Input
                                    id="industry"
                                    value={formData.industry}
                                    onChange={(e) =>
                                        setFormData({ ...formData, industry: e.target.value })
                                    }
                                    placeholder="Ex: Imobiliária, E-commerce"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={loading}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={loading} className="flex-1">
                                    {loading ? 'Criando...' : 'Criar Cliente'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
