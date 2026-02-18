import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import AgentConfigForm from '@/components/AgentConfigForm'
import ToolsManager from '@/components/ToolsManager'
import KnowledgeBaseManager from '@/components/KnowledgeBaseManager'
import Analytics from '@/components/Analytics'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Settings, Database, BarChart3, Wrench } from 'lucide-react'

interface PageProps {
    params: Promise<{ client_id: string }>
}

export const revalidate = 0

export default async function ClientePage({ params }: PageProps) {
    const { client_id } = await params

    // Fetch client
    const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('client_id', client_id)
        .single()

    if (!client) {
        return notFound()
    }

    // Fetch config
    const { data: config } = await supabase
        .from('agent_configs')
        .select('*')
        .eq('client_id', client.id) // Query config by UUID
        .single()

    return (
        <div className="min-h-screen text-foreground p-8 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">{client.name}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                {client.client_id}
                            </span>
                            {client.active ? (
                                <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Ativo
                                </span>
                            ) : (
                                <span className="text-xs text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded-full border border-slate-500/20">
                                    Inativo
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Actions can go here if needed */}
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="config" className="w-full">
                <TabsList className="w-full justify-start bg-transparent border-b border-white/5 p-0 h-auto gap-8 rounded-none mb-8">
                    <TabsTrigger
                        value="config"
                        className="tab-premium data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-0 pb-3 text-slate-400 data-[state=active]:text-blue-400 hover:text-slate-200 transition-all font-medium"
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        Configuração
                    </TabsTrigger>
                    <TabsTrigger
                        value="tools"
                        className="tab-premium data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none px-0 pb-3 text-slate-400 data-[state=active]:text-purple-400 hover:text-slate-200 transition-all font-medium"
                    >
                        <Wrench className="mr-2 h-4 w-4" />
                        Ferramentas
                    </TabsTrigger>
                    <TabsTrigger
                        value="knowledge"
                        className="tab-premium data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none px-0 pb-3 text-slate-400 data-[state=active]:text-emerald-400 hover:text-slate-200 transition-all font-medium"
                    >
                        <Database className="mr-2 h-4 w-4" />
                        Base de Conhecimento
                    </TabsTrigger>
                    <TabsTrigger
                        value="analytics"
                        className="tab-premium data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none px-0 pb-3 text-slate-400 data-[state=active]:text-amber-400 hover:text-slate-200 transition-all font-medium"
                    >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Analytics
                    </TabsTrigger>
                </TabsList>

                <div className="mt-4">
                    <TabsContent value="config" className="focus-visible:outline-none focus-visible:ring-0 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                        <AgentConfigForm clientId={client.id} config={config} />
                    </TabsContent>

                    <TabsContent value="tools" className="focus-visible:outline-none focus-visible:ring-0 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                        <ToolsManager clientId={client.id} config={config} />
                    </TabsContent>

                    <TabsContent value="knowledge" className="focus-visible:outline-none focus-visible:ring-0 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                        <KnowledgeBaseManager clientId={client.client_id} />
                    </TabsContent>

                    <TabsContent value="analytics" className="focus-visible:outline-none focus-visible:ring-0 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                        <Analytics clientId={client.client_id} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
