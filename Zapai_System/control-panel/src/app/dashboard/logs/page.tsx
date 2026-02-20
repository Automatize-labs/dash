"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getLogs } from "@/lib/api"
import { InteractionLog } from "@/lib/types"

export default function LogsPage() {
    const [logs, setLogs] = useState<InteractionLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLogs()
    }, [])

    async function fetchLogs() {
        try {
            setLoading(true)
            const data = await getLogs()
            // Sort by timestamp desc
            const sorted = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            setLogs(sorted)
        } catch (error) {
            console.error("Failed to fetch logs", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Interaction Logs</h1>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Agent</TableHead>
                            <TableHead>Lead</TableHead>
                            <TableHead>Input</TableHead>
                            <TableHead>Output</TableHead>
                            <TableHead>Tool</TableHead>
                            <TableHead>Conf.</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                    {new Date(log.timestamp).toLocaleString()}
                                </TableCell>
                                <TableCell>{log.agent_id}</TableCell>
                                <TableCell>{log.lead_id}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={log.message_in}>
                                    {log.message_in}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate" title={log.message_out}>
                                    {log.message_out}
                                </TableCell>
                                <TableCell>
                                    {log.tool_used ? (
                                        <Badge variant="secondary">{log.tool_used}</Badge>
                                    ) : (
                                        "-"
                                    )}
                                </TableCell>
                                <TableCell>
                                    {log.confidence.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                        {logs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">No logs found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
