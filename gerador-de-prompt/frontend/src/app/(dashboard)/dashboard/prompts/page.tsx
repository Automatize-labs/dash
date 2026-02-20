"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { apiListarPrompts, apiDeletarPrompt } from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { Prompt } from "@/types";
import {
    Clock,
    FileText,
    Star,
    Trash2,
    Eye,
    Search,
    Sparkles,
} from "lucide-react";

export default function PromptsPage() {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const supabase = createClient();

    const loadPrompts = async () => {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        try {
            const result = await apiListarPrompts(session.user.id);
            setPrompts(result.data || []);
        } catch {
            // API not available
        }
        setLoading(false);
    };

    useEffect(() => {
        loadPrompts();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este prompt?")) return;
        try {
            await apiDeletarPrompt(id);
            setPrompts((prev) => prev.filter((p) => p.id !== id));
            toast.success("Prompt excluído!");
        } catch {
            toast.error("Erro ao excluir prompt");
        }
    };

    const filteredPrompts = prompts.filter(
        (p) =>
            p.nome_agente.toLowerCase().includes(search.toLowerCase()) ||
            p.nome_empresa.toLowerCase().includes(search.toLowerCase())
    );

    const statusConfig: Record<string, { label: string; class: string }> = {
        draft: { label: "Rascunho", class: "badge-warning" },
        reviewed: { label: "Revisado", class: "badge-primary" },
        final: { label: "Finalizado", class: "badge-success" },
    };

    return (
        <div>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                }}
            >
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                        <span className="gradient-text">Histórico</span>
                    </h1>
                    <p style={{ color: "#94a3b8", fontSize: 14 }}>
                        {prompts.length} prompt{prompts.length !== 1 ? "s" : ""} salvo
                        {prompts.length !== 1 ? "s" : ""}
                    </p>
                </div>

                <Link href="/dashboard/novo">
                    <button className="btn-primary">
                        <Sparkles size={16} />
                        Novo Prompt
                    </button>
                </Link>
            </motion.div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 24 }}>
                <Search
                    size={18}
                    style={{
                        position: "absolute",
                        left: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#64748b",
                    }}
                />
                <input
                    className="input-field"
                    style={{ paddingLeft: 44 }}
                    placeholder="Buscar por nome do agente ou empresa..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* List */}
            {loading ? (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: 60,
                    }}
                >
                    <div className="spinner" style={{ width: 32, height: 32 }} />
                </div>
            ) : filteredPrompts.length === 0 ? (
                <div
                    className="glass-card"
                    style={{
                        padding: 60,
                        textAlign: "center",
                    }}
                >
                    <Clock size={48} color="#2a2a3e" style={{ margin: "0 auto 16px" }} />
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>
                        {search ? "Nenhum resultado encontrado" : "Nenhum prompt salvo"}
                    </h3>
                    <p style={{ color: "#64748b", fontSize: 14 }}>
                        {search
                            ? "Tente buscar com outros termos"
                            : "Crie seu primeiro prompt para vê-lo aqui"}
                    </p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {filteredPrompts.map((prompt, i) => (
                        <motion.div
                            key={prompt.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-card"
                            style={{
                                padding: 20,
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                            }}
                        >
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 12,
                                    background:
                                        prompt.status === "final"
                                            ? "rgba(16,185,129,0.1)"
                                            : "rgba(139,92,246,0.1)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                {prompt.status === "final" ? (
                                    <Star size={20} color="#10b981" />
                                ) : (
                                    <FileText size={20} color="#8b5cf6" />
                                )}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        marginBottom: 4,
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize: 15,
                                            fontWeight: 700,
                                            color: "#e2e8f0",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {prompt.nome_agente}
                                    </h3>
                                    <span
                                        className={`badge ${statusConfig[prompt.status]?.class || "badge-primary"
                                            }`}
                                    >
                                        {statusConfig[prompt.status]?.label || prompt.status}
                                    </span>
                                </div>
                                <p
                                    style={{
                                        fontSize: 13,
                                        color: "#94a3b8",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                    }}
                                >
                                    <span>{prompt.nome_empresa}</span>
                                    <span style={{ color: "#2a2a3e" }}>•</span>
                                    <span>
                                        {new Date(prompt.created_at).toLocaleDateString("pt-BR")}
                                    </span>
                                    {prompt.qualidade_score && (
                                        <>
                                            <span style={{ color: "#2a2a3e" }}>•</span>
                                            <span
                                                style={{
                                                    color:
                                                        prompt.qualidade_score >= 85
                                                            ? "#10b981"
                                                            : prompt.qualidade_score >= 60
                                                                ? "#f59e0b"
                                                                : "#ef4444",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Score: {prompt.qualidade_score}
                                            </span>
                                        </>
                                    )}
                                </p>
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                                <Link href={`/dashboard/${prompt.id}`}>
                                    <button
                                        className="btn-secondary"
                                        style={{ padding: "8px 14px" }}
                                    >
                                        <Eye size={14} />
                                    </button>
                                </Link>
                                <button
                                    onClick={() => handleDelete(prompt.id)}
                                    className="btn-secondary"
                                    style={{
                                        padding: "8px 14px",
                                        borderColor: "rgba(239,68,68,0.3)",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "#ef4444";
                                        e.currentTarget.style.color = "#ef4444";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                                        e.currentTarget.style.color = "#e2e8f0";
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
