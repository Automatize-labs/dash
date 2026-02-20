"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation" // Correct import for App Router
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createAgent, getAgent, updateAgent } from "@/lib/api"
import { AgentConfig } from "@/lib/types"

// We need to resolve params in Next.js 15+ if it's async, but for client component we can unwrap or use useArgs?
// Actually, in Next.js 13+ App Router, params is a prop. In client components, we can use `useParams`?
// Yes, useParams is safer for client components.
import { useParams } from "next/navigation"

export default function AgentEditorPage() {
    const router = useRouter()
    const params = useParams()
    const id = params?.id as string
    const isNew = id === "new"

    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<AgentConfig>({
        name: "",
        description: "",
        channel: "whatsapp",
        status: "active",
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        system_prompt: "You are a helpful assistant.",
        rules_prompt: "",
        personality_prompt: ""
    })

    useEffect(() => {
        if (!isNew && id) {
            fetchAgent(parseInt(id))
        }
    }, [id, isNew])

    async function fetchAgent(agentId: number) {
        try {
            const data = await getAgent(agentId)
            setFormData(data)
        } catch (error) {
            console.error("Failed to fetch agent", error)
            alert("Failed to fetch agent")
            router.push("/dashboard/agents")
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            if (isNew) {
                await createAgent(formData)
            } else {
                await updateAgent(parseInt(id), formData)
            }
            router.push("/dashboard/agents")
        } catch (error) {
            console.error("Failed to save agent", error)
            alert("Failed to save agent")
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">{isNew ? "Create Agent" : "Edit Agent"}</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" name="description" value={formData.description || ''} onChange={handleChange} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="channel">Channel</Label>
                            <Select value={formData.channel} onValueChange={(val) => handleSelectChange('channel', val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select channel" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                    <SelectItem value="telegram">Telegram</SelectItem>
                                    <SelectItem value="web">Web</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={formData.status} onValueChange={(val) => handleSelectChange('status', val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="paused">Paused</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="model">Model</Label>
                            <Select value={formData.model} onValueChange={(val) => handleSelectChange('model', val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select model" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="temperature">Temperature</Label>
                            <Input
                                id="temperature"
                                name="temperature"
                                type="number"
                                step="0.1"
                                min="0"
                                max="2"
                                value={formData.temperature}
                                onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="system_prompt">System Prompt</Label>
                        <Textarea
                            id="system_prompt"
                            name="system_prompt"
                            value={formData.system_prompt}
                            onChange={handleChange}
                            className="h-32 font-mono text-sm"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="rules_prompt">Rules Prompt</Label>
                        <Textarea
                            id="rules_prompt"
                            name="rules_prompt"
                            value={formData.rules_prompt}
                            onChange={handleChange}
                            className="h-32 font-mono text-sm"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="personality_prompt">Personality Prompt</Label>
                        <Textarea
                            id="personality_prompt"
                            name="personality_prompt"
                            value={formData.personality_prompt}
                            onChange={handleChange}
                            className="h-32 font-mono text-sm"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.push("/dashboard/agents")}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save Agent"}
                    </Button>
                </div>
            </form>

            {!isNew && id && (
                <div className="mt-8 rounded-lg border border-pink-500/20 bg-pink-500/5 p-6 backdrop-blur">
                    <h3 className="text-lg font-medium text-pink-400 mb-2">n8n Integration</h3>
                    <p className="text-sm text-gray-400 mb-4">
                        Use this Webhook URL in your n8n workflows to interact with this agent.
                    </p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 rounded bg-black/50 p-3 font-mono text-sm text-pink-300 border border-pink-500/30">
                            http://localhost:8001/agent/message (Agent ID: {id})
                        </code>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                navigator.clipboard.writeText(`http://localhost:8001/agent/message`)
                                alert("URL Copied!")
                            }}
                        >
                            Copy URL
                        </Button>
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                        Payload required: <span className="font-mono text-gray-400">{`{ "message": "...", "lead_id": "...", "metadata": { "agent_id": ${id} } }`}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
