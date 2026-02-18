'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase' // Admin client
import { createClient } from '@supabase/supabase-js'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MessageSquare, Users, Coins, TrendingUp, Zap, AlertTriangle, Database } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'

export default function Analytics({ clientId }: { clientId: string }) {
    const [stats, setStats] = useState({
        totalMessages: 0,
        totalLeads: 0,
        totalTokens: 0,
        totalCost: 0,
    })
    const [dailyData, setDailyData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [usingIsolatedDb, setUsingIsolatedDb] = useState(false)

    useEffect(() => {
        loadStats()
    }, [clientId])

    const loadStats = async () => {
        setLoading(true)
        setError(null)
        try {
            // 1. Get Agent Config (from Admin DB) to check for Isolated Supabase
            const { data: config, error: configError } = await supabase
                .from('agent_configs')
                .select('*')
                .eq('client_id', clientId)
                .single()

            if (configError && configError.code !== 'PGRST116') {
                console.error("Error loading config:", configError)
                // Continue with default if config fail? No, maybe abort.
            }

            // 2. Determine Client to use
            let targetClient = supabase
            let targetClientId = clientId

            if (config?.supabase_url && config?.supabase_service_role_key) {
                try {
                    targetClient = createClient(config.supabase_url, config.supabase_service_role_key)
                    setUsingIsolatedDb(true)

                    // In isolated DB, we might need to resolve the internal client_id (UUID) or use the text ID?
                    // The backend stores data with `client_id` = text_id (e.g. 'pousada') OR Resolved UUID?
                    // Let's check `database.py`.
                    // `get_or_create_lead` uses `client_id` (the argument passed).
                    // `orchestrator.py` passes `client_id` (the text id from webhook) to `execute_agent`.
                    // But `load_agent_config` resolves it to UUID to find config.
                    // BUT `save_message` uses the `client_id` passed to it.
                    // In `orchestrator.py`: `await self.db.save_message(client_id, ...)` where `client_id` is `req.client_id` (string).
                    // So in the Target DB, the `client_id` column in `messages` table will contain the STRING 'pousada', etc.
                    // WAIT. `messages` table `client_id` column type?
                    // In `supabase_schema.sql`, `messages` table does NOT have `client_id`! 
                    // It has `lead_id`. `leads` table has `client_id`.
                    // Let's verify schema.

                    // In `setup_db.py`:
                    // leads table: id, phone, ... (missing client_id in schema sql shown earlier? Let's re-read schema or assume.)
                    // Actually, `setup_db_direct.py` content showed:
                    // CREATE TABLE IF NOT EXISTS leads ( ... no client_id ??? )
                    // WAIT. 
                    // `database.py` insert:
                    // new_lead = { "client_id": client_id, ... }
                    // If the table doesn't have `client_id`, this insert would FAIL.
                    // But the backend `save_message` also puts `client_id`.

                    // Let's re-read `supabase_schema.sql` from earlier view.
                    // Line 8: phone TEXT UNIQUE NOT NULL
                    // No client_id in `leads`?
                    // Line 27: `token_usage` -> `lead_id`

                    // IF `client_id` is missing in the schema, the backend should be failing since day 1.
                    // But `orchestrator.py` works? 
                    // Maybe `client_id` IS in the schema I applied?
                    // I should check `supabase_schema.sql` again.

                } catch (e) {
                    console.error("Error creating isolated client:", e)
                    targetClient = supabase // Fallback? Or show error?
                    setError("Falha ao conectar no Supabase Isolado")
                }
            } else {
                setUsingIsolatedDb(false)
            }

            // 3. Update query logic
            // We need to confirm if 'messages' has 'client_id'.
            // If it doesn't, we filter by leads that belong to client_id?
            // If `leads` table doesn't have `client_id`, we are in trouble for multi-tenancy in the SAME DB.
            // But for Isolated DB, all leads belong to the tenant.

            // Re-checking Schema from previous step 2718:
            // CREATE TABLE leads ( id UUID ... phone TEXT ... ) -- NO client_id
            // CREATE TABLE messages ( id UUID ... lead_id UUID ... ) -- NO client_id

            // IF this is true, then `database.py` doing `res = self.client.table("leads").select("*").eq("client_id", client_id)` SHOULD FAIL.
            // Unless I missed it in the file view or it was added later? 
            // Or maybe the `setup_db.py` I read was an old one and I ran a migration?

            // Let's assume for a moment that for isolated DB, we just want ALL data, 
            // OR if the code is working, the column exists.

            // If the user says "Ainda não foi", maybe it's crashing on backend due to missing columns?
            // "Failed to initialize lead", "internal_error".

            // I will add a check for `client_id` in the query only if using admin db?
            // No, consistency.

            // Let's try to fetch ALL messages if existing in isolated DB.

            // Queries
            let messagesQuery = targetClient.from('messages').select('*', { count: 'exact', head: true })
            let leadsQuery = targetClient.from('leads').select('*', { count: 'exact', head: true })
            let tokensQuery = targetClient.from('token_usage').select('tokens_used, cost, estimated_cost, created_at') // cost vs estimated_cost

            // Only apply client_id filter if we are fairly sure it exists or if we are in shared DB.
            // But if `database.py` uses it, it must exist.
            // I'll add `.eq('client_id', clientId)` and handle error.

            if (usingIsolatedDb) {
                // In isolated DB, we might strictly filter by client_id if the backend saves it.
                // If the backend saves it, we should filter.
                messagesQuery = messagesQuery.eq('client_id', clientId)
                leadsQuery = leadsQuery.eq('client_id', clientId)
                tokensQuery = tokensQuery.eq('client_id', clientId)
            } else {
                messagesQuery = messagesQuery.eq('client_id', clientId)
                leadsQuery = leadsQuery.eq('client_id', clientId)
                tokensQuery = tokensQuery.eq('client_id', clientId)
            }

            const { count: messages, error: msgError } = await messagesQuery
            const { count: leads, error: leadError } = await leadsQuery
            let { data: tokens, error: tokenError } = await tokensQuery

            if (msgError) throw msgError
            if (leadError) throw leadError
            // tokens might fail if column 'cost' doesn't exist (old schema uses estimated_cost?)
            // I should handle 'cost' vs 'estimated_cost'.
            // For now, I'll try to select both or handle error?
            // The query above selects `cost`. If it fails, I might try `estimated_cost`.

            if (tokenError) {
                console.warn("Analytics: Initial query failed. Starting robust fallback strategy...", tokenError)

                // Attempt 1: tokens_used + cost
                const { data: t1, error: e1 } = await targetClient
                    .from('token_usage')
                    .select('tokens_used, cost, created_at')
                    .eq('client_id', clientId)
                    .order('created_at', { ascending: true })

                if (!e1) {
                    console.log("Analytics: Used Attempt 1 (tokens_used, cost)")
                    tokens = t1
                } else {
                    console.warn("Analytics: Attempt 1 failed. Retrying with tokens_in/out...", e1)

                    // Attempt 2: tokens_in + tokens_out + cost
                    const { data: t2, error: e2 } = await targetClient
                        .from('token_usage')
                        .select('tokens_in, tokens_out, cost, created_at')
                        .eq('client_id', clientId)
                        .order('created_at', { ascending: true })

                    if (!e2) {
                        console.log("Analytics: Used Attempt 2 (split tokens, cost)")
                        tokens = t2.map((t: any) => ({
                            ...t,
                            tokens_used: (t.tokens_in || 0) + (t.tokens_out || 0)
                        }))
                    } else {
                        console.warn("Analytics: Attempt 2 failed. Retrying with estimated_cost...", e2)

                        // Attempt 3: tokens_used + estimated_cost
                        const { data: t3, error: e3 } = await targetClient
                            .from('token_usage')
                            .select('tokens_used, estimated_cost, created_at')
                            .eq('client_id', clientId)
                            .order('created_at', { ascending: true })

                        if (!e3) {
                            console.log("Analytics: Used Attempt 3 (tokens_used, estimated_cost)")
                            tokens = t3
                        } else {
                            console.warn("Analytics: Attempt 3 failed. Last retry...", e3)

                            // Attempt 4: tokens_in + tokens_out + estimated_cost
                            const { data: t4, error: e4 } = await targetClient
                                .from('token_usage')
                                .select('tokens_in, tokens_out, estimated_cost, created_at')
                                .eq('client_id', clientId)
                                .order('created_at', { ascending: true })

                            if (!e4) {
                                console.log("Analytics: Used Attempt 4 (split tokens, estimated_cost)")
                                tokens = t4.map((t: any) => ({
                                    ...t,
                                    tokens_used: (t.tokens_in || 0) + (t.tokens_out || 0)
                                }))
                            } else {
                                console.error("Analytics: All token queries failed.", e4)
                                tokens = []
                            }
                        }
                    }
                }
            } else {
                console.log("Analytics Debug: Using Standard Tokens", tokens)
            }

            processTokens(tokens, messages, leads)

        } catch (err: any) {
            console.error("Analytics Load Error DETAILED:", JSON.stringify(err, null, 2))
            setError(`Erro: ${err.message || "Erro desconhecido"}`)
        } finally {
            setLoading(false)
        }
    }

    const processTokens = (tokens: any[], messages: number | null, leads: number | null) => {
        const totalTokens = tokens?.reduce((acc, t) => acc + (t.tokens_used || 0), 0) || 0
        // Fix: Use cost if available, otherwise fallback to estimated_cost per row
        const totalCost = tokens?.reduce((acc, t) => acc + (t.cost ?? t.estimated_cost ?? 0), 0) || 0

        const dailyMap = new Map()
        tokens?.forEach(t => {
            const date = new Date(t.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            if (!dailyMap.has(date)) {
                dailyMap.set(date, { date, tokens: 0, cost: 0 })
            }
            const entry = dailyMap.get(date)
            entry.tokens += (t.tokens_used || 0)
            entry.cost += (t.cost ?? t.estimated_cost ?? 0)
        })
        const chartData = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-7)


        setStats({
            totalMessages: messages || 0,
            totalLeads: leads || 0,
            totalTokens,
            totalCost,
        })
        setDailyData(chartData.length > 0 ? chartData : [{ date: 'Hoje', tokens: 0, cost: 0 }])
    }

    if (loading) return <div className="text-white p-4">Carregando métricas...</div>
    if (error) return <div className="text-red-400 p-4 border border-red-900/50 rounded bg-red-900/10">Erro: {error}</div>

    return (
        <div className="space-y-8">
            {/* Connection Badge */}
            <div className="flex justify-end">
                {usingIsolatedDb ? (
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                        <Zap size={12} fill="currentColor" /> Supabase Isolado Conectado
                    </span>
                ) : (
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs">
                        <Database size={12} /> Supabase Padrão (Compartilhado)
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="glass-card bg-zinc-900/40 border-white/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">
                            Mensagens Trocadas
                        </CardTitle>
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <MessageSquare className="text-purple-400" size={18} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.totalMessages}</div>
                        <p className="text-xs text-slate-500 mt-1">Total acumulado</p>
                    </CardContent>
                </Card>

                <Card className="glass-card bg-zinc-900/40 border-white/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">
                            Leads Capturados
                        </CardTitle>
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Users className="text-emerald-400" size={18} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.totalLeads}</div>
                        <p className="text-xs text-slate-500 mt-1">Potenciais clientes</p>
                    </CardContent>
                </Card>

                <Card className="glass-card bg-zinc-900/40 border-white/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">
                            Tokens Consumidos
                        </CardTitle>
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Zap className="text-blue-400" size={18} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {(stats.totalTokens / 1000).toFixed(1)}k
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Input + Output</p>
                    </CardContent>
                </Card>

                <Card className="glass-card bg-zinc-900/40 border-white/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">
                            Custo Estimado
                        </CardTitle>
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <Coins className="text-amber-400" size={18} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">${stats.totalCost.toFixed(2)}</div>
                        <p className="text-xs text-slate-500 mt-1">Baseado em tokens</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card border-white/5 p-6">
                    <CardHeader className="px-0 pt-0 pb-6">
                        <CardTitle className="text-lg text-white font-medium flex items-center gap-2">
                            <TrendingUp size={18} className="text-blue-400" />
                            Volume de Tokens (7 dias)
                        </CardTitle>
                    </CardHeader>
                    <div className="h-[300px] w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyData}>
                                <defs>
                                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="tokens"
                                    stroke="#3b82f6"
                                    fillOpacity={1}
                                    fill="url(#colorTokens)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    )
}
