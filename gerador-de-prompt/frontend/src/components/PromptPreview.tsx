"use client";

import { motion } from "framer-motion";
import type { Qualidade } from "@/types";
import CopyButton from "./CopyButton";
import {
    Shield,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Sparkles,
} from "lucide-react";

interface PromptPreviewProps {
    prompt: string;
    qualidade: Qualidade;
    onSave?: () => void;
    saving?: boolean;
}

export default function PromptPreview({
    prompt,
    qualidade,
    onSave,
    saving,
}: PromptPreviewProps) {
    const scoreColor =
        qualidade.score_total >= 85
            ? "#10b981"
            : qualidade.score_total >= 60
                ? "#f59e0b"
                : "#ef4444";

    const checks = [
        {
            label: "Sem Contradições",
            ok: !qualidade.tem_contradicoes,
        },
        {
            label: "Sem Redundâncias",
            ok: !qualidade.tem_redundancias,
        },
        {
            label: "Sem Alucinações",
            ok: !qualidade.tem_alucinacoes,
        },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Quality Score */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card"
                style={{ padding: 24 }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 20,
                    }}
                >
                    <Shield size={18} color="#8b5cf6" />
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>
                        Qualidade do Prompt
                    </h3>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 32,
                        flexWrap: "wrap",
                    }}
                >
                    {/* Score Circle */}
                    <div
                        style={{
                            width: 100,
                            height: 100,
                            borderRadius: "50%",
                            background: `conic-gradient(${scoreColor} ${qualidade.score_total * 3.6
                                }deg, #1a1a2e 0deg)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <div
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: "50%",
                                background: "#12121a",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 28,
                                fontWeight: 800,
                                color: scoreColor,
                            }}
                        >
                            {qualidade.score_total}
                        </div>
                    </div>

                    {/* Metrics */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <span style={{ fontSize: 13, color: "#94a3b8" }}>Clareza</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div
                                    style={{
                                        width: 120,
                                        height: 6,
                                        borderRadius: 3,
                                        background: "#1a1a2e",
                                        overflow: "hidden",
                                    }}
                                >
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${qualidade.clareza}%` }}
                                        transition={{ duration: 1, delay: 0.3 }}
                                        style={{
                                            height: "100%",
                                            background: "#8b5cf6",
                                            borderRadius: 3,
                                        }}
                                    />
                                </div>
                                <span
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: "#e2e8f0",
                                        width: 32,
                                        textAlign: "right",
                                    }}
                                >
                                    {qualidade.clareza}
                                </span>
                            </div>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <span style={{ fontSize: 13, color: "#94a3b8" }}>Completude</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div
                                    style={{
                                        width: 120,
                                        height: 6,
                                        borderRadius: 3,
                                        background: "#1a1a2e",
                                        overflow: "hidden",
                                    }}
                                >
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${qualidade.completude}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        style={{
                                            height: "100%",
                                            background: "#06b6d4",
                                            borderRadius: 3,
                                        }}
                                    />
                                </div>
                                <span
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: "#e2e8f0",
                                        width: 32,
                                        textAlign: "right",
                                    }}
                                >
                                    {qualidade.completude}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Checks */}
                <div
                    style={{
                        display: "flex",
                        gap: 16,
                        marginTop: 20,
                        paddingTop: 16,
                        borderTop: "1px solid #1a1a2e",
                        flexWrap: "wrap",
                    }}
                >
                    {checks.map((check) => (
                        <div
                            key={check.label}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 13,
                                color: check.ok ? "#10b981" : "#ef4444",
                                fontWeight: 500,
                            }}
                        >
                            {check.ok ? (
                                <CheckCircle size={14} />
                            ) : (
                                <XCircle size={14} />
                            )}
                            {check.label}
                        </div>
                    ))}
                </div>

                {/* Suggestions */}
                {qualidade.sugestoes?.length > 0 && (
                    <div
                        style={{
                            marginTop: 16,
                            padding: 12,
                            background: "rgba(245,158,11,0.08)",
                            border: "1px solid rgba(245,158,11,0.2)",
                            borderRadius: 10,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                marginBottom: 8,
                            }}
                        >
                            <AlertTriangle size={14} color="#f59e0b" />
                            <span
                                style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b" }}
                            >
                                Sugestões
                            </span>
                        </div>
                        <ul style={{ listStyle: "none", padding: 0 }}>
                            {qualidade.sugestoes.map((s, i) => (
                                <li
                                    key={i}
                                    style={{
                                        fontSize: 12,
                                        color: "#94a3b8",
                                        padding: "4px 0",
                                    }}
                                >
                                    • {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </motion.div>

            {/* Prompt Output */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
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
                    <div
                        style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                        <Sparkles size={18} color="#8b5cf6" />
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>
                            Prompt Gerado
                        </h3>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <CopyButton text={prompt} label="Copiar" />
                        {onSave && (
                            <button
                                onClick={onSave}
                                disabled={saving}
                                className="btn-secondary"
                                style={{ padding: "10px 20px", fontSize: 13 }}
                            >
                                {saving ? <div className="spinner" /> : "💾 Salvar"}
                            </button>
                        )}
                    </div>
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
                        fontFamily: "'Inter', monospace",
                    }}
                >
                    {prompt}
                </div>
            </motion.div>
        </div>
    );
}
