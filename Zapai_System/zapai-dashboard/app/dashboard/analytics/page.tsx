import { supabase } from '@/lib/supabase'
import AnalyticsWrapper from '@/components/AnalyticsWrapper'

export const revalidate = 0

export default async function AnalyticsPage() {
    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching clients for analytics:", error)
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Analytics & Custos
                </h1>
                <p className="text-slate-400 mt-2">Acompanhe o consumo de tokens e custos detalhados por agente.</p>
            </div>

            <AnalyticsWrapper clients={clients || []} />
        </div>
    )
}
