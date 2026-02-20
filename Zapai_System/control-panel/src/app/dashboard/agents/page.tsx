"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { getAgents, deleteAgent } from "@/lib/api"
import { AgentConfig } from "@/lib/types"

export default function AgentsPage() {
    const [agents, setAgents] = useState<AgentConfig[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAgents()
    }, [])

    async function fetchAgents() {
        try {
            setLoading(true)
            const data = await getAgents()
            setAgents(data)
        } catch (error) {
            console.error("Failed to fetch agents", error)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("Are you sure you want to delete this agent?")) return
        try {
            await deleteAgent(id)
            fetchAgents()
        } catch (error) {
            console.error("Failed to delete agent", error)
            alert("Failed to delete agent")
        }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Agents</h1>
                <Link href="/dashboard/agents/new">
                    <Button>Create Agent</Button>
                </Link>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {agents.map((agent) => (
                            <TableRow key={agent.id}>
                                <TableCell>{agent.id}</TableCell>
                                <TableCell className="font-medium">{agent.name}</TableCell>
                                <TableCell>{agent.channel}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {agent.status}
                                    </span>
                                </TableCell>
                                <TableCell>{agent.model}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={`/dashboard/agents/${agent.id}`}>
                                            <Button variant="outline" size="sm">Edit</Button>
                                        </Link>
                                        <Button variant="destructive" size="sm" onClick={() => agent.id && handleDelete(agent.id)}>
                                            Delete
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {agents.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">No agents found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
