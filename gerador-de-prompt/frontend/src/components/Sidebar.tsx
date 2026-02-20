"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    Zap,
    LayoutDashboard,
    Plus,
    Clock,
    BookTemplate,
    LogOut,
    ChevronLeft,
    ChevronRight,
    User,
} from "lucide-react";

const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/novo", icon: Plus, label: "Novo Prompt" },
    { href: "/dashboard/prompts", icon: Clock, label: "Histórico" },
    { href: "/dashboard/frameworks", icon: BookTemplate, label: "Frameworks" },
];

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        toast.success("Logout realizado!");
        router.push("/login");
    };

    return (
        <motion.aside
            animate={{ width: collapsed ? 72 : 260 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{
                height: "100vh",
                background: "rgba(12, 12, 18, 0.95)",
                borderRight: "1px solid #2a2a3e",
                display: "flex",
                flexDirection: "column",
                position: "sticky",
                top: 0,
                zIndex: 50,
                overflow: "hidden",
                backdropFilter: "blur(20px)",
            }}
        >
            {/* Logo */}
            <div
                style={{
                    padding: collapsed ? "20px 16px" : "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    borderBottom: "1px solid #1a1a2e",
                }}
            >
                <div
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <Zap size={20} color="white" />
                </div>
                <AnimatePresence>
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            style={{ fontSize: 18, fontWeight: 800, whiteSpace: "nowrap" }}
                        >
                            <span className="gradient-text">ZapPrompt</span>
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Nav */}
            <nav
                style={{
                    flex: 1,
                    padding: "16px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                }}
            >
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: collapsed ? "12px 16px" : "12px 16px",
                                borderRadius: 10,
                                textDecoration: "none",
                                color: isActive ? "#e2e8f0" : "#94a3b8",
                                background: isActive
                                    ? "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.08))"
                                    : "transparent",
                                borderLeft: isActive
                                    ? "3px solid #8b5cf6"
                                    : "3px solid transparent",
                                transition: "all 0.2s ease",
                                fontSize: 14,
                                fontWeight: isActive ? 600 : 500,
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = "#1a1a2e";
                                    e.currentTarget.style.color = "#e2e8f0";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.color = "#94a3b8";
                                }
                            }}
                        >
                            <item.icon size={20} style={{ flexShrink: 0 }} />
                            <AnimatePresence>
                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        style={{ whiteSpace: "nowrap" }}
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom actions */}
            <div
                style={{
                    padding: "12px",
                    borderTop: "1px solid #1a1a2e",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                }}
            >
                <button
                    onClick={handleLogout}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 16px",
                        borderRadius: 10,
                        background: "transparent",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 500,
                        transition: "all 0.2s",
                        width: "100%",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                        e.currentTarget.style.color = "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#94a3b8";
                    }}
                >
                    <LogOut size={20} style={{ flexShrink: 0 }} />
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ whiteSpace: "nowrap" }}
                            >
                                Sair
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "8px",
                        borderRadius: 8,
                        background: "#1a1a2e",
                        border: "1px solid #2a2a3e",
                        color: "#94a3b8",
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>
        </motion.aside>
    );
}
