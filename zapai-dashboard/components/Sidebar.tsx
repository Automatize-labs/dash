'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Link2, LogOut, Zap, TrendingUp } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Agentes', href: '/dashboard', icon: Users }, // Temporarily same link if "Agentes" view is home
    { name: 'Integrações', href: '/dashboard/integracoes', icon: Link2 },
    { name: 'Analytics', href: '/dashboard/analytics', icon: LayoutDashboard }, // Using LayoutDashboard or maybe TrendingUp?
]

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-[280px] glass-sidebar flex flex-col">
            {/* Logo */}
            <div className="p-8 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Zap className="text-white fill-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            ZapAI
                        </h1>
                        <p className="text-xs text-slate-500 font-medium tracking-wider">PREMIUM AGENTS</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-8 space-y-2">
                {navItems.map((item) => {
                    const isActive = item.href === '/dashboard'
                        ? pathname === '/dashboard' || pathname.startsWith('/dashboard/novo') || (pathname.startsWith('/dashboard/') && !pathname.includes('integracoes'))
                        : pathname.startsWith(item.href)

                    // Special case for "Agentes" if it's meant to list agents, which acts as Dashboard/Home for now.
                    // Let's refine: "Dashboard" goes to home. "Agentes" goes to home too? Or maybe filter? 
                    // For now keeping simple.

                    // Actually, let's make Dashboard strictly Home. 
                    // Agentes could be same page or a specific view. 
                    // To follow the user prompt, both seem to point to dashboard home or list.

                    const isItemActive = item.href === '/dashboard' && pathname === '/dashboard' ? true :
                        item.name === 'Agentes' && (pathname.startsWith('/dashboard/') && pathname !== '/dashboard' && !pathname.includes('integracoes')) ? true :
                            item.href === pathname;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                ActiveLink(item.href, pathname)
                                    ? "bg-white/5 text-white font-medium border border-white/5 shadow-inner"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {ActiveLink(item.href, pathname) && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full" />
                            )}
                            <item.icon
                                size={20}
                                className={cn(
                                    "transition-colors",
                                    ActiveLink(item.href, pathname) ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                                )}
                            />
                            <span>{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-white/5 mb-4">
                <div
                    onClick={async () => {
                        await fetch('/auth/signout', { method: 'POST' })
                        window.location.href = '/login'
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                >
                    <Avatar className="w-10 h-10 border border-white/10">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white group-hover:text-blue-200 transition-colors">Admin User</p>
                        <p className="text-xs text-slate-500 truncate">admin@zapai.com</p>
                    </div>
                    <LogOut size={16} className="text-slate-500 group-hover:text-red-400 transition-colors" />
                </div>
            </div>
        </aside>
    )
}

function ActiveLink(href: string, pathname: string) {
    if (href === '/dashboard' && pathname === '/dashboard') return true
    if (href === '/dashboard' && pathname.startsWith('/dashboard/') && !pathname.includes('integracoes')) return true // Keep dashboard active for subpages unless integrations
    if (href === '/dashboard/integracoes' && pathname.includes('integracoes')) return true
    return false
}
