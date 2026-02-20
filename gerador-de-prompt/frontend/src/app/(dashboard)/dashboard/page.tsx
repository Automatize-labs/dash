"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { apiListarPrompts } from "@/lib/api";
import { motion } from "framer-motion";
import {
    Zap,
    FileText,
    TrendingUp,
    Clock,
    Plus,
    Star,
    ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface Stats {
    totalPrompts: number;
    finalizados: number;
    rascunhos: number;
    ultimoPrompt: string | null;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats>({
        totalPrompts: 0,
        finalizados: 0,
        rascunhos: 0,
        ultimoPrompt: null,
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const loadStats = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) return;

            try {
                const response = await apiListarPrompts(session.user.id);
                const prompts = response.data || [];

                setStats({
                    totalPrompts: prompts.length,
                    finalizados: prompts.filter(
                        (p: { status: string }) => p.status === "final"
                    ).length,
                    rascunhos: prompts.filter(
                        (p: { status: string }) => p.status === "draft"
                    ).length,
                    ultimoPrompt: prompts[0]?.nome_agente || null,
                });
            } catch {
                // API not available yet
            }
            setLoading(false);
        };

        loadStats();
    }, [supabase.auth]);

    const statCards = [
        {
            label: "Total de Prompts",
            value: stats.totalPrompts,
            icon: FileText,
            color: "#8b5cf6",
            bg: "rgba(139,92,246,0.1)",
        },
        {
            label: "Finalizados",
            value: stats.finalizados,
            icon: Star,
            color: "#10b981",
            bg: "rgba(16,185,129,0.1)",
        },
        {
            label: "Rascunhos",
            value: stats.rascunhos,
            icon: Clock,
            color: "#f59e0b",
            bg: "rgba(245,158,11,0.1)",
        },
        {
            label: "Taxa de Conclusão",
            value:
                stats.totalPrompts > 0
                    ? `${Math.round((stats.finalizados / stats.totalPrompts) * 100)}%`
                    : "0%",
            icon: TrendingUp,
            color: "#06b6d4",
            bg: "rgba(6,182,212,0.1)",
        },
    ];

    return (
        <div>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 32 }}
            >
                <h1
                    style={{
                        fontSize: 28,
                        fontWeight: 800,
                        marginBottom: 8,
                    }}
                >
                    <span className="gradient-text">Dashboard</span>
                </h1>
                <p style={{ color: "#94a3b8", fontSize: 14 }}>
                    Bem-vindo ao ZapPrompt — seu gerador de prompts profissional
                </p>
            </motion.div>

            {/* Stats Grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 20,
                    marginBottom: 32,
                }}
            >
                {statCards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card"
                        style={{ padding: 24 }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 16,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "#94a3b8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                }}
                            >
                                {card.label}
                            </span>
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background: card.bg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <card.icon size={18} color={card.color} />
                            </div>
                        </div>
                        <div
                            style={{
                                fontSize: 32,
                                fontWeight: 800,
                                color: card.color,
                            }}
                        >
                            {loading ? <div className="spinner" /> : card.value}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <h2
                    style={{
                        fontSize: 18,
                        fontWeight: 700,
                        marginBottom: 16,
                        color: "#e2e8f0",
                    }}
                >
                    Ações Rápidas
                </h2>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: 16,
                    }}
                >
                    <Link href="/dashboard/novo" style={{ textDecoration: "none" }}>
                        <div
                            className="glass-card"
                            style={{
                                padding: 24,
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                cursor: "pointer",
                            }}
                        >
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    background:
                                        "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <Plus size={24} color="white" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3
                                    style={{
                                        fontSize: 16,
                                        fontWeight: 700,
                                        color: "#e2e8f0",
                                        marginBottom: 4,
                                    }}
                                >
                                    Criar Novo Prompt
                                </h3>
                                <p
                                    style={{
                                        fontSize: 13,
                                        color: "#94a3b8",
                                    }}
                                >
                                    Gere um system prompt profissional com IA
                                </p>
                            </div>
                            <ArrowRight size={18} color="#64748b" />
                        </div>
                    </Link>

                    <Link href="/dashboard/prompts" style={{ textDecoration: "none" }}>
                        <div
                            className="glass-card"
                            style={{
                                padding: 24,
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                cursor: "pointer",
                            }}
                        >
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    background:
                                        "linear-gradient(135deg, #06b6d4, #10b981)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <Clock size={24} color="white" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3
                                    style={{
                                        fontSize: 16,
                                        fontWeight: 700,
                                        color: "#e2e8f0",
                                        marginBottom: 4,
                                    }}
                                >
                                    Ver Histórico
                                </h3>
                                <p
                                    style={{
                                        fontSize: 13,
                                        color: "#94a3b8",
                                    }}
                                >
                                    Acesse prompts criados anteriormente
                                </p>
                            </div>
                            <ArrowRight size={18} color="#64748b" />
                        </div>
                    </Link>
                </div>
            </motion.div>

            {/* Recent Activity */}
            {stats.ultimoPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    style={{ marginTop: 32 }}
                >
                    <h2
                        style={{
                            fontSize: 18,
                            fontWeight: 700,
                            marginBottom: 16,
                            color: "#e2e8f0",
                        }}
                    >
                        Atividade Recente
                    </h2>
                    <div
                        className="glass-card"
                        style={{
                            padding: 20,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        <Zap size={18} color="#8b5cf6" />
                        <span style={{ color: "#94a3b8", fontSize: 14 }}>
                            Último prompt criado:{" "}
                            <strong style={{ color: "#e2e8f0" }}>
                                {stats.ultimoPrompt}
                            </strong>
                        </span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
