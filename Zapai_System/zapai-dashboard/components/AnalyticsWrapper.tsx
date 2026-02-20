"use client"

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Analytics from '@/components/Analytics'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface Client {
    id: string
    client_id: string // name
    // other fields...
}

export default function AnalyticsWrapper({ clients }: { clients: any[] }) {
    const [selectedClientId, setSelectedClientId] = useState<string | null>(clients.length > 0 ? clients[0].client_id : null)

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white">Filtrar por Agente</h2>
                    <p className="text-slate-400 text-sm">Selecione um agente para ver seus custos e métricas.</p>
                </div>
                <div className="w-full md:w-[300px]">
                    <Select
                        value={selectedClientId || ''}
                        onValueChange={(value) => setSelectedClientId(value)}
                    >
                        <SelectTrigger className="bg-zinc-900/50 border-white/10 text-white">
                            <SelectValue placeholder="Selecione um agente" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            {clients.map((client) => (
                                <SelectItem key={client.id} value={client.client_id} className="focus:bg-zinc-800 focus:text-white cursor-pointer">
                                    {client.client_id}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {selectedClientId ? (
                <Analytics clientId={selectedClientId} />
            ) : (
                <Card className="glass-card bg-zinc-900/40 border-white/5">
                    <CardContent className="flex items-center justify-center p-12 text-slate-400">
                        Selecione um agente para visualizar os dados.
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
