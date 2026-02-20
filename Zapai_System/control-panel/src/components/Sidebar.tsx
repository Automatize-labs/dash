"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Terminal, FileText, Wrench, Zap, PieChart, Box } from "lucide-react"

const parsePath = (path: string) => {
    if (path === "/dashboard") return "dashboard"
    if (path.startsWith("/dashboard/agents")) return "agents"
    if (path.startsWith("/dashboard/logs")) return "logs"
    if (path.startsWith("/dashboard/tools")) return "tools"
    return ""
}

export function Sidebar() {
    const pathname = usePathname()
    const active = parsePath(pathname)

    const links = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
        { href: "/dashboard/agents", label: "Agents", icon: Users, id: "agents" },
        { href: "/dashboard/tools", label: "Tools", icon: Wrench, id: "tools" },
        { href: "/dashboard/logs", label: "Analytics", icon: PieChart, id: "logs" },
    ]

    return (
        <div className="flex h-full w-64 flex-col bg-[#0b0a0f] border-r border-[#1e1b29]">
            <div className="flex h-20 items-center px-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Zap className="h-5 w-5 text-white fill-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">Apexify</span>
                </div>
            </div>

            <div className="flex-1 overflow-auto py-6">
                <div className="px-6 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Overview</div>
                <nav className="space-y-1">
                    {links.map((link) => {
                        const Icon = link.icon
                        const isActive = active === link.id
                        return (
                            <Link
                                key={link.id}
                                href={link.href}
                                className={`relative flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200 
                        ${isActive
                                        ? "active-nav-item text-white"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <Icon className={`h-5 w-5 ${isActive ? "text-indigo-400" : "text-gray-500 group-hover:text-white"}`} />
                                {link.label}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-[#1e1b29]">
                <div className="rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 p-4 border border-indigo-500/30">
                    <div className="flex items-center gap-3 mb-2">
                        <Box className="text-indigo-400 h-5 w-5" />
                        <h4 className="text-sm font-bold text-white">Pro Plan</h4>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">Get detailed analytics for help you.</p>
                    <button className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-colors shadow-lg shadow-indigo-600/20">
                        Upgrade Now
                    </button>
                </div>
            </div>
        </div>
    )
}
