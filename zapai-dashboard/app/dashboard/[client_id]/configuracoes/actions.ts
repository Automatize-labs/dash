'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use Service Role to bypass RLS for Admin Configs
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function getAgentConfig(clientId: string) {
    if (!clientId) return { error: 'Client ID required' }

    try {
        const { data, error } = await supabase
            .from('agent_configs')
            .select('followup_webhook, followup_rules, followup_enabled')
            .eq('client_id', clientId)
            .single()

        if (error) {
            // If not found, return empty defaults
            if (error.code === 'PGRST116') {
                return {
                    followup_webhook: '',
                    followup_rules: [],
                    followup_enabled: false
                }
            }
            throw error
        }

        return data
    } catch (error: any) {
        console.error('Error fetching config:', error)
        return { error: error.message }
    }
}

export async function updateAgentConfig(clientId: string, config: any) {
    if (!clientId) return { error: 'Client ID required' }

    try {
        // Check if exists
        const { data: existing } = await supabase
            .from('agent_configs')
            .select('id')
            .eq('client_id', clientId)
            .single()

        let error
        if (existing) {
            const { error: updateError } = await supabase
                .from('agent_configs')
                .update({
                    followup_webhook: config.webhook,
                    followup_rules: config.rules,
                    followup_enabled: config.enabled
                })
                .eq('client_id', clientId)
            error = updateError
        } else {
            // Create if new agent (shouldn't happen often but good fallback)
            const { error: insertError } = await supabase
                .from('agent_configs')
                .insert({
                    client_id: clientId,
                    followup_webhook: config.webhook,
                    followup_rules: config.rules,
                    followup_enabled: config.enabled
                })
            error = insertError
        }

        if (error) throw error
        return { success: true }
    } catch (error: any) {
        console.error('Error updating config:', error)
        return { error: error.message }
    }
}

export async function testWebhook(webhookUrl: string, clientId: string) {
    if (!webhookUrl) return { error: 'URL do Webhook é obrigatória' }

    try {
        const payload = {
            event: "test_trigger",
            client_id: clientId,
            phone: "5511999999999",
            lead_name: "Lead de Teste",
            minutes_inactive: 0,
            message: "🔔 Teste do ZapAI: Seu webhook está funcionando!"
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            const text = await response.text()
            throw new Error(`Erro ${response.status}: ${text}`)
        }

        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
