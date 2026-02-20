"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { Framework } from "@/types";
import {
    BookTemplate,
    Plus,
    Trash2,
    X,
    ShoppingCart,
    Headphones,
    LifeBuoy,
    Settings,
} from "lucide-react";

const tipoConfig: Record<
    string,
    { label: string; icon: React.ElementType; color: string }
> = {
    vendas: { label: "Vendas", icon: ShoppingCart, color: "#10b981" },
    atendimento: { label: "Atendimento", icon: Headphones, color: "#8b5cf6" },
    suporte: { label: "Suporte", icon: LifeBuoy, color: "#06b6d4" },
    custom: { label: "Customizado", icon: Settings, color: "#f59e0b" },
};

export default function FrameworksPage() {
    const [frameworks, setFrameworks] = useState<Framework[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    // Form
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [tipo, setTipo] = useState("custom");
    const [conteudo, setConteudo] = useState("");

    const loadFrameworks = async () => {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        try {
            const { data } = await supabase
                .from("frameworks")
                .select("*")
                .or(`user_id.eq.${session.user.id},is_public.eq.true`)
                .order("created_at", { ascending: false });

            setFrameworks(data || []);
        } catch {
            // table might not exist yet
        }
        setLoading(false);
    };

    useEffect(() => {
        loadFrameworks();
    }, []);

    const handleSave = async () => {
        if (!nome || !conteudo) {
            toast.error("Nome e conteúdo são obrigatórios");
            return;
        }

        setSaving(true);
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        try {
            const { error } = await supabase.from("frameworks").insert({
                user_id: session.user.id,
                nome,
                descricao,
                tipo,
                conteudo,
                is_public: false,
            });

            if (error) throw error;

            toast.success("Framework salvo!");
            setShowModal(false);
            setNome("");
            setDescricao("");
            setConteudo("");
            setTipo("custom");
            loadFrameworks();
        } catch {
            toast.error("Erro ao salvar framework");
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir?")) return;

        try {
            await supabase.from("frameworks").delete().eq("id", id);
            setFrameworks((prev) => prev.filter((f) => f.id !== id));
            toast.success("Framework excluído!");
        } catch {
            toast.error("Erro ao excluir");
        }
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
                        <span className="gradient-text">Frameworks</span>
                    </h1>
                    <p style={{ color: "#94a3b8", fontSize: 14 }}>
                        Gerencie templates e frameworks para seus prompts
                    </p>
                </div>

                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} />
                    Novo Framework
                </button>
            </motion.div>

            {/* Grid */}
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
            ) : frameworks.length === 0 ? (
                <div
                    className="glass-card"
                    style={{
                        padding: 60,
                        textAlign: "center",
                    }}
                >
                    <BookTemplate
                        size={48}
                        color="#2a2a3e"
                        style={{ margin: "0 auto 16px" }}
                    />
                    <h3
                        style={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: "#94a3b8",
                            marginBottom: 8,
                        }}
                    >
                        Nenhum framework salvo
                    </h3>
                    <p style={{ color: "#64748b", fontSize: 14 }}>
                        Crie frameworks para reutilizar em seus prompts
                    </p>
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                        gap: 16,
                    }}
                >
                    {frameworks.map((fw, i) => {
                        const config = tipoConfig[fw.tipo] || tipoConfig.custom;
                        const Icon = config.icon;

                        return (
                            <motion.div
                                key={fw.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-card"
                                style={{ padding: 20 }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: 12,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 8,
                                                background: `${config.color}15`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <Icon size={18} color={config.color} />
                                        </div>
                                        <div>
                                            <h3
                                                style={{
                                                    fontSize: 15,
                                                    fontWeight: 700,
                                                    color: "#e2e8f0",
                                                }}
                                            >
                                                {fw.nome}
                                            </h3>
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color: config.color,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.05em",
                                                }}
                                            >
                                                {config.label}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(fw.id)}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            cursor: "pointer",
                                            color: "#64748b",
                                            padding: 4,
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {fw.descricao && (
                                    <p
                                        style={{
                                            fontSize: 13,
                                            color: "#94a3b8",
                                            marginBottom: 12,
                                        }}
                                    >
                                        {fw.descricao}
                                    </p>
                                )}

                                <div
                                    style={{
                                        background: "#0a0a0f",
                                        border: "1px solid #1a1a2e",
                                        borderRadius: 8,
                                        padding: 12,
                                        maxHeight: 100,
                                        overflowY: "auto",
                                        fontSize: 12,
                                        color: "#64748b",
                                        whiteSpace: "pre-wrap",
                                    }}
                                >
                                    {fw.conteudo.substring(0, 200)}
                                    {fw.conteudo.length > 200 && "..."}
                                </div>

                                <p
                                    style={{
                                        fontSize: 11,
                                        color: "#64748b",
                                        marginTop: 12,
                                        textAlign: "right",
                                    }}
                                >
                                    {new Date(fw.created_at).toLocaleDateString("pt-BR")}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 100,
                        padding: 20,
                    }}
                    onClick={() => setShowModal(false)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card"
                        style={{
                            width: "100%",
                            maxWidth: 520,
                            padding: 32,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 24,
                            }}
                        >
                            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Novo Framework</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#64748b",
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 16,
                            }}
                        >
                            <div>
                                <label className="label">Nome *</label>
                                <input
                                    className="input-field"
                                    placeholder="Ex: Framework de Vendas Consultivas"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="label">Descrição</label>
                                <input
                                    className="input-field"
                                    placeholder="Breve descrição do framework"
                                    value={descricao}
                                    onChange={(e) => setDescricao(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="label">Tipo</label>
                                <select
                                    className="input-field"
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                >
                                    <option value="vendas">Vendas</option>
                                    <option value="atendimento">Atendimento</option>
                                    <option value="suporte">Suporte</option>
                                    <option value="custom">Customizado</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Conteúdo *</label>
                                <textarea
                                    className="input-field"
                                    rows={8}
                                    placeholder="Cole aqui o conteúdo do framework..."
                                    value={conteudo}
                                    onChange={(e) => setConteudo(e.target.value)}
                                />
                            </div>

                            <button
                                className="btn-primary"
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    width: "100%",
                                    justifyContent: "center",
                                    marginTop: 8,
                                }}
                            >
                                {saving ? <div className="spinner" /> : "Salvar Framework"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
