import { Button } from '@/components/ui/button'
import ClientCard from '@/components/ClientCard'
import { Plus, Search, MessageSquare, Users, Zap, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

export const revalidate = 0

export default async function DashboardPage() {
    // Fetch Clients
    const { data: clients, error } = await supabase
        .from('clients')
        .select('*, agent_configs(*)')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching clients:', error)
    }

    // Fetch Global Metrics
    const { count: messageCount } = await supabase.from('messages').select('*', { count: 'exact', head: true })
    const { count: leadCount } = await supabase.from('leads').select('*', { count: 'exact', head: true })

    // Create metrics array
    const metrics = [
        {
            label: 'Agentes Ativos',
            value: clients?.filter(c => c.active).length || 0,
            trend: '+2 este mês',
            icon: Zap,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20'
        },
        {
            label: 'Total Mensagens',
            value: messageCount || 0,
            trend: '+15% vs mês anterior',
            icon: MessageSquare,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20'
        },
        {
            label: 'Leads Capturados',
            value: leadCount || 0,
            trend: '+8 este mês',
            icon: Users,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20'
        },

    ]

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto text-foreground">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Bem-vindo de volta, Admin 👋
                    </h1>
                    <p className="text-slate-400 mt-2">Visão geral do seu estúdio de agentes</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <Input
                            placeholder="Buscar agentes..."
                            className="pl-10 w-[280px] input-premium rounded-full"
                        />
                    </div>
                    <Link href="/dashboard/novo">
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full shadow-lg shadow-purple-500/25 border border-white/10 transition-all hover:scale-105">
                            <Plus size={20} className="mr-2" />
                            Novo Agente
                        </Button>
                    </Link>
                </div>
            </div>

            <Separator className="bg-white/5" />

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, i) => (
                    <div key={i} className={`glass-card p-6 rounded-2xl border ${metric.border} hover:scale-[1.02] transition-transform`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-400">{metric.label}</p>
                                <h3 className="text-2xl font-bold text-white mt-1">{metric.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl ${metric.bg}`}>
                                <metric.icon className={metric.color} size={20} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs">
                            <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                {metric.trend}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Agents Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Seus Agentes</h2>
                    <Button variant="link" className="text-slate-400 hover:text-white">Ver todos</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {clients?.map((client) => (
                        <ClientCard key={client.id} client={client} />
                    ))}

                    {/* Add New Agent Card Placehodler (Optional visual) */}
                    <Link href="/dashboard/novo" className="group relative flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-2xl hover:bg-white/5 transition-all cursor-pointer min-h-[200px]">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Plus className="text-slate-400 group-hover:text-white" />
                        </div>
                        <p className="text-slate-400 font-medium group-hover:text-white">Criar Novo Agente</p>
                    </Link>
                </div>
            </div>
        </div>
    )
}
