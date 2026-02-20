"use client"

import { useEffect, useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getTools } from "@/lib/api"
import { ToolConfig } from "@/lib/types"

export default function ToolsPage() {
    const [tools, setTools] = useState<ToolConfig[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTools()
    }, [])

    async function fetchTools() {
        try {
            setLoading(true)
            const data = await getTools()
            setTools(data)
        } catch (error) {
            console.error("Failed to fetch tools", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Tools</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                    <Card key={tool.name}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{tool.name}</CardTitle>
                                <Badge variant={tool.is_active ? "default" : "secondary"}>
                                    {tool.is_active ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                            <CardDescription>{tool.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">
                                <pre className="whitespace-pre-wrap rounded-md bg-muted p-2">
                                    {JSON.stringify(tool.parameters, null, 2)}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {tools.length === 0 && (
                    <div className="col-span-3 text-center text-muted-foreground">
                        No tools registered.
                    </div>
                )}
            </div>
        </div>
    )
}
