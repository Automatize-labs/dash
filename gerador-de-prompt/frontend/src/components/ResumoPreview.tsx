"use client";

import { motion } from "framer-motion";
import type { Resumo } from "@/types";
import {
    User,
    Building,
    Target,
    Users,
    Shield,
    AlertTriangle,
    CheckCircle,
    Settings,
    Brain,
} from "lucide-react";

interface ResumoPreviewProps {
    resumo: Resumo;
    onEdit?: (field: string, value: unknown) => void;
}

export default function ResumoPreview({ resumo }: ResumoPreviewProps) {
    const sections = [
        {
            title: "Agente",
            icon: User,
            items: [
                { label: "Nome", value: resumo.nome_agente },
                { label: "Função", value: resumo.funcao_principal },
            ],
        },
        {
            title: "Empresa",
            icon: Building,
            items: [
                { label: "Nome", value: resumo.nome_empresa },
                { label: "Email", value: resumo.email },
                { label: "Telefone", value: resumo.telefone },
            ],
        },
        {
            title: "Público-Alvo",
            icon: Users,
            items: [
                { label: "Público", value: resumo.publico_alvo },
                { label: "Nível", value: resumo.nivel_conhecimento },
            ],
        },
        {
            title: "Comportamento",
            icon: Brain,
            items: [
                { label: "Tom de Voz", value: resumo.tom_voz?.join(", ") },
                { label: "Decisões", value: resumo.pode_decisoes },
            ],
        },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sections.map((section, i) => (
                <motion.div
                    key={section.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card"
                    style={{ padding: 20 }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 12,
                        }}
                    >
                        <section.icon size={16} color="#8b5cf6" />
                        <h3
                            style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#e2e8f0",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            {section.title}
                        </h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {section.items.map((item) => (
                            <div
                                key={item.label}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 13,
                                        color: "#94a3b8",
                                        fontWeight: 500,
                                    }}
                                >
                                    {item.label}
                                </span>
                                <span
                                    style={{
                                        fontSize: 13,
                                        color: "#e2e8f0",
                                        fontWeight: 600,
                                        textAlign: "right",
                                        maxWidth: "60%",
                                    }}
                                >
                                    {item.value || "—"}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            ))}

            {/* Lists */}
            {resumo.problemas_resolve?.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card"
                    style={{ padding: 20 }}
                >
                    <div
                        style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}
                    >
                        <Target size={16} color="#10b981" />
                        <h3
                            style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#e2e8f0",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            Problemas a Resolver
                        </h3>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {resumo.problemas_resolve.map((p, i) => (
                            <span key={i} className="badge badge-success">
                                {p}
                            </span>
                        ))}
                    </div>
                </motion.div>
            )}

            {resumo.nao_pode_fazer?.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card"
                    style={{ padding: 20 }}
                >
                    <div
                        style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}
                    >
                        <Shield size={16} color="#ef4444" />
                        <h3
                            style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#e2e8f0",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            Restrições
                        </h3>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {resumo.nao_pode_fazer.map((r, i) => (
                            <span key={i} className="badge badge-danger">
                                {r}
                            </span>
                        ))}
                    </div>
                </motion.div>
            )}

            {resumo.regras_obrigatorias?.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass-card"
                    style={{ padding: 20 }}
                >
                    <div
                        style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}
                    >
                        <CheckCircle size={16} color="#f59e0b" />
                        <h3
                            style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#e2e8f0",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            Regras Obrigatórias
                        </h3>
                    </div>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {resumo.regras_obrigatorias.map((r, i) => (
                            <li
                                key={i}
                                style={{
                                    fontSize: 13,
                                    color: "#e2e8f0",
                                    padding: "6px 0",
                                    borderBottom:
                                        i < resumo.regras_obrigatorias.length - 1
                                            ? "1px solid #1a1a2e"
                                            : "none",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <span style={{ color: "#f59e0b" }}>•</span>
                                {r}
                            </li>
                        ))}
                    </ul>
                </motion.div>
            )}
        </div>
    );
}
