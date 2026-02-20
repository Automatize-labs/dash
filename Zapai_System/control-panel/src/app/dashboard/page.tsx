"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAgents, getLogs } from "@/lib/api"
import { AgentConfig, InteractionLog } from "@/lib/types"
import { Users, Activity, Zap, MessageSquare, TrendingUp, MoreHorizontal, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const chartData = [
    { name: "Jan", sales: 4000 },
    { name: "Feb", sales: 3000 },
    { name: "Mar", sales: 5000 },
    { name: "Apr", sales: 4500 },
    { name: "May", sales: 6000 },
    { name: "Jun", sales: 5500 },
    { name: "Jul", sales: 7000 },
]

export default function DashboardPage() {
    const [agents, setAgents] = useState<AgentConfig[]>([])
    const [logs, setLogs] = useState<InteractionLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const [agentsData, logsData] = await Promise.all([
                    getAgents(),
                    getLogs()
                ])
                setAgents(agentsData)
                setLogs(logsData)
            } catch (error) {
                console.error("Failed to fetch dashboard data", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return <div className="p-8 text-indigo-400 animate-pulse">Loading system data...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Dashboard</h1>
                    <div className="flex gap-4 text-xs text-gray-500 font-medium">
                        <span className="text-white border-b-2 border-indigo-500 pb-1">Overview</span>
                        <span>Notifications</span>
                        <span>Trade History</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="bg-[#1e1b29] text-gray-400 px-3 py-1.5 rounded-lg text-xs border border-white/5 hover:text-white transition-colors">Oct 28 - Dec 15</button>
                    <button className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">Share</button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Primary Gradient Card */}
                <Card className="purple-gradient-card border-0 relative overflow-hidden text-white">
                    <div className="absolute top-0 right-0 p-3 opacity-20"><Zap className="h-16 w-16" /></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                            <Wallet className="h-4 w-4" />
                        </div>
                        <MoreHorizontal className="h-4 w-4 text-white/50" />
                    </CardHeader>
                    <CardContent className="relative z-10 pt-4">
                        <div className="text-xs text-indigo-200 mb-1">Total Income</div>
                        <div className="text-2xl font-bold mb-1">$348,261</div>
                        <div className="text-xs flex items-center gap-1 text-green-400 font-medium">
                            <ArrowUpRight className="h-3 w-3" /> +12.5%
                            <span className="text-white/40 ml-1">vs last month</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Standard Dark Cards */}
                {[
                    { title: "Profit", value: "$15,708.98", change: "+8.1%", icon: Activity, color: "text-green-400" },
                    { title: "Total Revenue", value: "7,415.644", change: "-3.2%", icon: TrendingUp, color: "text-red-400" },
                    { title: "Total Agents", value: agents.length.toString(), change: "+2 New", icon: Users, color: "text-indigo-400" }
                ].map((stat, i) => (
                    <Card key={i} className="bg-[#141218] border border-[#2a2735] hover:border-indigo-500/30 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="h-8 w-8 rounded-full bg-[#1e1b29] flex items-center justify-center text-gray-400">
                                <stat.icon className="h-4 w-4" />
                            </div>
                            <MoreHorizontal className="h-4 w-4 text-gray-600" />
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="text-xs text-gray-400 mb-1">{stat.title}</div>
                            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                            <div className={`text-xs flex items-center gap-1 font-medium ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                                {stat.change.startsWith('+') ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {stat.change}
                                <span className="text-gray-600 ml-1">vs last month</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Analytics & Session Grid */}
            <div className="grid gap-4 md:grid-cols-3 h-[300px]">
                {/* Chart */}
                <Card className="col-span-2 bg-[#141218] border border-[#2a2735]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-white">Analytic</CardTitle>
                        <div className="flex gap-2">
                            <span className="text-xs text-gray-500 border border-[#2a2735] px-2 py-1 rounded">Sales Estimation</span>
                            <MoreHorizontal className="h-4 w-4 text-gray-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e1b29', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#8b5cf6' }}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Session By Country */}
                <Card className="col-span-1 bg-[#141218] border border-[#2a2735]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-white">Session by Country</CardTitle>
                        <MoreHorizontal className="h-4 w-4 text-gray-600" />
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                        {[
                            { country: "United States", val: 85, color: "bg-indigo-500" },
                            { country: "Japan", val: 70, color: "bg-purple-500" },
                            { country: "Indonesia", val: 45, color: "bg-indigo-400" },
                            { country: "South Korea", val: 38, color: "bg-purple-400" },
                        ].map((item, i) => (
                            <div key={i} className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>{item.country}</span>
                                    <span>{item.val}%</span>
                                </div>
                                <div className="h-2 w-full bg-[#1e1b29] rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.val}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History / Logs */}
            <div className="rounded-xl border border-[#2a2735] bg-[#141218] p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
                    <div className="flex gap-2">
                        <button className="text-xs text-gray-400 px-3 py-1 rounded border border-[#2a2735] hover:text-white">Download</button>
                        <button className="text-xs text-white bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-700">Re-issue</button>
                    </div>
                </div>
                <div className="space-y-3">
                    {logs.slice(0, 5).map((log, i) => (
                        <div key={i} className="grid grid-cols-4 items-center p-3 rounded-lg hover:bg-[#1e1b29] transition-colors border-b border-[#2a2735] last:border-0">
                            <div className="flex items-center gap-3 col-span-1">
                                <div className="h-8 w-8 rounded-full bg-[#2a2735] flex items-center justify-center text-xs text-white">
                                    {log.agent_id}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">Agent Interaction</div>
                                    <div className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div className="text-sm text-white col-span-2 truncate pr-4">
                                "{log.message_in}"
                            </div>
                            <div className="flex items-center justify-end gap-2 col-span-1">
                                <div className={`text-xs px-2 py-0.5 rounded-full ${log.error ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                    {log.error ? 'Failed' : 'Success'}
                                </div>
                                <MoreHorizontal className="h-4 w-4 text-gray-600" />
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && <div className="text-sm text-gray-500 text-center py-4">No recent transactions</div>}
                </div>
            </div>
        </div>
    )
}
