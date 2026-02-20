"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, UserPlus, Sparkles } from "lucide-react";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem");
            return;
        }

        if (password.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres");
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            toast.error(error.message);
            setLoading(false);
            return;
        }

        toast.success("Conta criada com sucesso! Verifique seu email.");
        router.push("/login");
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                    "radial-gradient(ellipse at 50% 0%, rgba(6, 182, 212, 0.12) 0%, #0a0a0f 60%)",
                padding: "20px",
            }}
        >
            <div
                style={{
                    position: "fixed",
                    top: "20%",
                    right: "15%",
                    width: 300,
                    height: 300,
                    borderRadius: "50%",
                    background:
                        "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
                    filter: "blur(60px)",
                    pointerEvents: "none",
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{ width: "100%", maxWidth: 440 }}
            >
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: 16,
                            background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 16,
                        }}
                    >
                        <Zap size={32} color="white" />
                    </motion.div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                        <span className="gradient-text">ZapPrompt</span>
                    </h1>
                    <p style={{ color: "#94a3b8", fontSize: 14 }}>
                        Crie sua conta e comece a gerar prompts profissionais
                    </p>
                </div>

                <div className="glass-card" style={{ padding: 32 }}>
                    <h2
                        style={{
                            fontSize: 20,
                            fontWeight: 700,
                            marginBottom: 24,
                            textAlign: "center",
                        }}
                    >
                        Criar nova conta
                    </h2>

                    <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <div>
                            <label className="label">
                                <Mail size={12} style={{ display: "inline", marginRight: 4 }} />
                                Email
                            </label>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="label">
                                <Lock size={12} style={{ display: "inline", marginRight: 4 }} />
                                Senha
                            </label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="label">
                                <Lock size={12} style={{ display: "inline", marginRight: 4 }} />
                                Confirmar Senha
                            </label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="Repita a senha"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                        >
                            {loading ? (
                                <div className="spinner" />
                            ) : (
                                <>
                                    Criar Conta
                                    <UserPlus size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <div
                        style={{
                            textAlign: "center",
                            marginTop: 24,
                            paddingTop: 20,
                            borderTop: "1px solid #2a2a3e",
                        }}
                    >
                        <p style={{ color: "#94a3b8", fontSize: 14 }}>
                            Já tem uma conta?{" "}
                            <Link
                                href="/login"
                                style={{
                                    color: "#8b5cf6",
                                    fontWeight: 600,
                                    textDecoration: "none",
                                }}
                            >
                                Fazer login
                            </Link>
                        </p>
                    </div>
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    style={{
                        textAlign: "center",
                        color: "#64748b",
                        fontSize: 12,
                        marginTop: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                    }}
                >
                    <Sparkles size={12} />
                    Powered by OpenAI GPT-4o
                </motion.p>
            </motion.div>
        </div>
    );
}
