"use client"

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Workflow, Database, Zap, ArrowRight, ExternalLink, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function IntegracoesPage() {
    const integrations = [
        {
            name: 'OpenAI',
            description: 'Modelo de inteligência (GPT-4) e Embeddings.',
            status: 'Conectado',
            icon: Zap,
            color: 'text-green-400',
            bg: 'bg-green-500/10'
        },
        {
            name: 'Supabase',
            description: 'Banco de dados vetorial e autenticação.',
            status: 'Conectado',
            icon: Database,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10'
        },
        {
            name: 'N8N (Workflows)',
            description: 'Automação de processos e ferramentas externas.',
            status: 'Ativo',
            icon: Workflow,
            color: 'text-pink-400',
            bg: 'bg-pink-500/10'
        }
    ]

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Integrações
                </h1>
                <p className="text-slate-400 mt-2">Gerencie as conexões do seu ecossistema de agentes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((item, i) => (
                    <Card key={i} className="glass-card border-white/5 hover:scale-[1.02] transition-transform">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className={`p-3 rounded-xl ${item.bg}`}>
                                    <item.icon className={item.color} size={24} />
                                </div>
                                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                                    <CheckCircle size={12} />
                                    {item.status}
                                </span>
                            </div>
                            <CardTitle className="text-xl text-white mt-4">{item.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-400 text-sm mb-6 min-h-[40px]">
                                {item.description}
                            </p>
                            <Button variant="outline" className="w-full border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
                                Configurar
                                <ExternalLink size={14} className="ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-white/5 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">Precisa de mais integrações?</h3>
                    <p className="text-slate-400 max-w-xl">
                        O ZapAI suporta webhooks personalizados e chamadas de API. Configure qualquer ferramenta compatível com REST no painel de ferramentas do agente.
                    </p>
                </div>
                <Link href="/dashboard/novo">
                    <Button className="bg-white text-black hover:bg-slate-200 shadow-lg shadow-white/5">
                        Criar Agente Personalizado
                        <ArrowRight size={16} className="ml-2" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}
