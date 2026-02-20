"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGetPrompt } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import CopyButton from "@/components/CopyButton";
import type { Prompt } from "@/types";
import {
    ArrowLeft,
    FileText,
    Building,
    Star,
    Calendar,
    Sparkles,
} from "lucide-react";

export default function PromptDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [prompt, setPrompt] = useState<Prompt | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPrompt = async () => {
            try {
                const result = await apiGetPrompt(id as string);
                setPrompt(result.data);
            } catch {
                toast.error("Prompt não encontrado");
                router.push("/dashboard/prompts");
            }
            setLoading(false);
        };

        if (id) loadPrompt();
    }, [id, router]);

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: 60,
                }}
            >
                <div className="spinner" style={{ width: 32, height: 32 }} />
            </div>
        );
    }

    if (!prompt) return null;

    return (
        <div>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 24 }}
            >
                <button
                    className="btn-secondary"
                    onClick={() => router.push("/dashboard/prompts")}
                    style={{ marginBottom: 16, padding: "8px 16px" }}
                >
                    <ArrowLeft size={14} />
                    Voltar
                </button>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                            {prompt.nome_agente}
                        </h1>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                color: "#94a3b8",
                                fontSize: 14,
                            }}
                        >
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                }}
                            >
                                <Building size={14} />
                                {prompt.nome_empresa}
                            </span>
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                }}
                            >
                                <Calendar size={14} />
                                {new Date(prompt.created_at).toLocaleDateString("pt-BR")}
                            </span>
                            {prompt.qualidade_score && (
                                <span
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                        color:
                                            prompt.qualidade_score >= 85
                                                ? "#10b981"
                                                : "#f59e0b",
                                        fontWeight: 600,
                                    }}
                                >
                                    <Star size={14} />
                                    Score: {prompt.qualidade_score}
                                </span>
                            )}
                        </div>
                    </div>

                    {prompt.prompt_final && (
                        <CopyButton text={prompt.prompt_final} label="Copiar Prompt" />
                    )}
                </div>
            </motion.div>

            {/* Prompt Content */}
            {prompt.prompt_final && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card"
                    style={{ padding: 24, marginBottom: 20 }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 16,
                        }}
                    >
                        <Sparkles size={18} color="#8b5cf6" />
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>
                            System Prompt
                        </h3>
                    </div>
                    <div
                        style={{
                            background: "#0a0a0f",
                            border: "1px solid #1a1a2e",
                            borderRadius: 12,
                            padding: 20,
                            maxHeight: 500,
                            overflowY: "auto",
                            fontSize: 13,
                            lineHeight: 1.8,
                            color: "#e2e8f0",
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {prompt.prompt_final}
                    </div>
                </motion.div>
            )}

            {/* Form Data */}
            {prompt.resumo && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card"
                    style={{ padding: 24 }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 16,
                        }}
                    >
                        <FileText size={18} color="#06b6d4" />
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>
                            Dados da Análise
                        </h3>
                    </div>
                    <div
                        style={{
                            background: "#0a0a0f",
                            border: "1px solid #1a1a2e",
                            borderRadius: 12,
                            padding: 20,
                            fontSize: 13,
                            lineHeight: 1.6,
                            color: "#94a3b8",
                            whiteSpace: "pre-wrap",
                            fontFamily: "monospace",
                        }}
                    >
                        {JSON.stringify(prompt.resumo, null, 2)}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
