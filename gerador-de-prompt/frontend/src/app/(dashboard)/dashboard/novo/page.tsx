"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { apiAnalisar, apiGerarPrompt, apiSalvarPrompt } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PDFUpload from "@/components/PDFUpload";
import ResumoPreview from "@/components/ResumoPreview";
import PromptPreview from "@/components/PromptPreview";
import type { Resumo, Qualidade } from "@/types";
import {
    FileText,
    Brain,
    Sparkles,
    ArrowRight,
    ArrowLeft,
    Loader2,
    CheckCircle,
} from "lucide-react";

type Step = "form" | "resumo" | "prompt";

export default function NovoPromptPage() {
    const [step, setStep] = useState<Step>("form");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    // Form state
    const [nomeAgente, setNomeAgente] = useState("");
    const [nomeEmpresa, setNomeEmpresa] = useState("");
    const [emailEmpresa, setEmailEmpresa] = useState("");
    const [telefone, setTelefone] = useState("");
    const [funcaoPrincipal, setFuncaoPrincipal] = useState("");
    const [problemas, setProblemas] = useState("");
    const [publicoAlvo, setPublicoAlvo] = useState("");
    const [nivelConhecimento, setNivelConhecimento] = useState("leigo");
    const [tomVoz, setTomVoz] = useState("");
    const [podeDecisoes, setPodeDecisoes] = useState("orientar");
    const [naoPodeFazer, setNaoPodeFazer] = useState("");
    const [palavrasEvitar, setPalavrasEvitar] = useState("");
    const [regrasObrigatorias, setRegrasObrigatorias] = useState("");
    const [integracoes, setIntegracoes] = useState("");
    const [infoSensiveis, setInfoSensiveis] = useState("");
    const [lgpd, setLgpd] = useState("");
    const [metricasSucesso, setMetricasSucesso] = useState("");

    // PDF & Framework
    const [pdfText, setPdfText] = useState("");
    const [frameworkText, setFrameworkText] = useState("");

    // Results
    const [resumo, setResumo] = useState<Resumo | null>(null);
    const [promptFinal, setPromptFinal] = useState("");
    const [qualidade, setQualidade] = useState<Qualidade | null>(null);

    const buildFormData = () => ({
        nome_agente: nomeAgente,
        nome_empresa: nomeEmpresa,
        email_empresa: emailEmpresa,
        telefone,
        funcao_principal: funcaoPrincipal,
        problemas: problemas.split("\n").filter(Boolean),
        publico_alvo: publicoAlvo,
        nivel_conhecimento: nivelConhecimento,
        tom_voz: tomVoz.split(",").map((s) => s.trim()).filter(Boolean),
        pode_decisoes: podeDecisoes,
        nao_pode_fazer: naoPodeFazer.split("\n").filter(Boolean),
        palavras_evitar: palavrasEvitar.split(",").map((s) => s.trim()).filter(Boolean),
        regras_obrigatorias: regrasObrigatorias.split("\n").filter(Boolean),
        integracoes: integracoes.split(",").map((s) => s.trim()).filter(Boolean),
        info_sensiveis: infoSensiveis.split("\n").filter(Boolean),
        lgpd: lgpd || null,
        metricas_sucesso: metricasSucesso.split("\n").filter(Boolean),
    });

    const handleAnalisar = async () => {
        if (!nomeAgente || !nomeEmpresa) {
            toast.error("Nome do agente e empresa são obrigatórios");
            return;
        }

        setLoading(true);
        try {
            const result = await apiAnalisar({
                form_data: buildFormData(),
                pdf_text: pdfText || undefined,
                framework: frameworkText || undefined,
            });

            if (result.success) {
                setResumo(result.resumo);
                setStep("resumo");
                toast.success("Análise concluída!");
            }
        } catch (err) {
            toast.error("Erro na análise. Verifique os dados e tente novamente.");
        }
        setLoading(false);
    };

    const handleGerarPrompt = async () => {
        if (!resumo) return;

        setLoading(true);
        try {
            const result = await apiGerarPrompt({
                resumo,
                template_customizado: frameworkText || undefined,
            });

            if (result.success) {
                setPromptFinal(result.prompt);
                setQualidade(result.qualidade);
                setStep("prompt");
                toast.success("Prompt gerado com sucesso!");
            }
        } catch {
            toast.error("Erro ao gerar prompt. Tente novamente.");
        }
        setLoading(false);
    };

    const handleSalvar = async () => {
        setSaving(true);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
                toast.error("Sessão expirada. Faça login novamente.");
                return;
            }

            await apiSalvarPrompt({
                user_id: session.user.id,
                nome_agente: nomeAgente,
                nome_empresa: nomeEmpresa,
                email_empresa: emailEmpresa,
                telefone,
                form_data: buildFormData(),
                framework_text: frameworkText || null,
                resumo,
                prompt_final: promptFinal,
                status: "final",
                qualidade_score: qualidade?.score_total || null,
            });

            toast.success("Prompt salvo com sucesso!");
        } catch {
            toast.error("Erro ao salvar prompt.");
        }
        setSaving(false);
    };

    const steps = [
        { id: "form" as Step, label: "Formulário", icon: FileText },
        { id: "resumo" as Step, label: "Resumo", icon: Brain },
        { id: "prompt" as Step, label: "Prompt Final", icon: Sparkles },
    ];

    const currentStepIndex = steps.findIndex((s) => s.id === step);

    return (
        <div>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 32 }}
            >
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                    <span className="gradient-text">Novo Prompt</span>
                </h1>
                <p style={{ color: "#94a3b8", fontSize: 14 }}>
                    Preencha os dados e gere um system prompt profissional
                </p>
            </motion.div>

            {/* Step Indicator */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 32,
                    padding: "16px 20px",
                    background: "rgba(18,18,26,0.6)",
                    borderRadius: 14,
                    border: "1px solid #1a1a2e",
                }}
            >
                {steps.map((s, i) => (
                    <div
                        key={s.id}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flex: 1,
                        }}
                    >
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background:
                                    i <= currentStepIndex
                                        ? "linear-gradient(135deg, #8b5cf6, #06b6d4)"
                                        : "#1a1a2e",
                                transition: "all 0.3s",
                                flexShrink: 0,
                            }}
                        >
                            {i < currentStepIndex ? (
                                <CheckCircle size={18} color="white" />
                            ) : (
                                <s.icon size={18} color={i <= currentStepIndex ? "white" : "#64748b"} />
                            )}
                        </div>
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: i <= currentStepIndex ? 600 : 400,
                                color: i <= currentStepIndex ? "#e2e8f0" : "#64748b",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {s.label}
                        </span>
                        {i < steps.length - 1 && (
                            <div
                                style={{
                                    flex: 1,
                                    height: 2,
                                    background: i < currentStepIndex ? "#8b5cf6" : "#1a1a2e",
                                    borderRadius: 1,
                                    margin: "0 8px",
                                    transition: "all 0.3s",
                                }}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {step === "form" && (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 24,
                            }}
                        >
                            {/* Left Column */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                <div className="glass-card" style={{ padding: 24 }}>
                                    <h3
                                        style={{
                                            fontSize: 16,
                                            fontWeight: 700,
                                            marginBottom: 20,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        <FileText size={18} color="#8b5cf6" />
                                        Dados Básicos
                                    </h3>

                                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                        <div>
                                            <label className="label">Nome do Agente *</label>
                                            <input
                                                className="input-field"
                                                placeholder="Ex: Ana, Assistente Virtual"
                                                value={nomeAgente}
                                                onChange={(e) => setNomeAgente(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Nome da Empresa *</label>
                                            <input
                                                className="input-field"
                                                placeholder="Ex: TechCorp Solutions"
                                                value={nomeEmpresa}
                                                onChange={(e) => setNomeEmpresa(e.target.value)}
                                            />
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                            <div>
                                                <label className="label">Email</label>
                                                <input
                                                    type="email"
                                                    className="input-field"
                                                    placeholder="contato@empresa.com"
                                                    value={emailEmpresa}
                                                    onChange={(e) => setEmailEmpresa(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="label">Telefone</label>
                                                <input
                                                    className="input-field"
                                                    placeholder="(11) 99999-9999"
                                                    value={telefone}
                                                    onChange={(e) => setTelefone(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-card" style={{ padding: 24 }}>
                                    <h3
                                        style={{
                                            fontSize: 16,
                                            fontWeight: 700,
                                            marginBottom: 20,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        <Brain size={18} color="#06b6d4" />
                                        Função e Comportamento
                                    </h3>

                                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                        <div>
                                            <label className="label">Função Principal</label>
                                            <textarea
                                                className="input-field"
                                                rows={2}
                                                placeholder="O que este agente faz?"
                                                value={funcaoPrincipal}
                                                onChange={(e) => setFuncaoPrincipal(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Problemas que Resolve (um por linha)</label>
                                            <textarea
                                                className="input-field"
                                                rows={3}
                                                placeholder="Atendimento ao cliente&#10;Dúvidas sobre produtos&#10;Agendamento"
                                                value={problemas}
                                                onChange={(e) => setProblemas(e.target.value)}
                                            />
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                            <div>
                                                <label className="label">Público-Alvo</label>
                                                <input
                                                    className="input-field"
                                                    placeholder="Ex: Clientes B2B"
                                                    value={publicoAlvo}
                                                    onChange={(e) => setPublicoAlvo(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="label">Nível de Conhecimento</label>
                                                <select
                                                    className="input-field"
                                                    value={nivelConhecimento}
                                                    onChange={(e) => setNivelConhecimento(e.target.value)}
                                                >
                                                    <option value="leigo">Leigo</option>
                                                    <option value="intermediario">Intermediário</option>
                                                    <option value="avancado">Avançado</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                            <div>
                                                <label className="label">Tom de Voz (separados por vírgula)</label>
                                                <input
                                                    className="input-field"
                                                    placeholder="Profissional, Amigável, Empático"
                                                    value={tomVoz}
                                                    onChange={(e) => setTomVoz(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="label">Pode Tomar Decisões</label>
                                                <select
                                                    className="input-field"
                                                    value={podeDecisoes}
                                                    onChange={(e) => setPodeDecisoes(e.target.value)}
                                                >
                                                    <option value="orientar">Apenas Orientar</option>
                                                    <option value="simples">Decisões Simples</option>
                                                    <option value="regras">Seguir Regras</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                <div className="glass-card" style={{ padding: 24 }}>
                                    <h3
                                        style={{
                                            fontSize: 16,
                                            fontWeight: 700,
                                            marginBottom: 20,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        📄 Upload de PDF
                                    </h3>
                                    <PDFUpload onTextExtracted={setPdfText} />
                                </div>

                                <div className="glass-card" style={{ padding: 24 }}>
                                    <h3
                                        style={{
                                            fontSize: 16,
                                            fontWeight: 700,
                                            marginBottom: 20,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        📋 Framework / Template
                                    </h3>
                                    <textarea
                                        className="input-field"
                                        rows={6}
                                        placeholder="Cole aqui um framework de vendas, atendimento ou template customizado..."
                                        value={frameworkText}
                                        onChange={(e) => setFrameworkText(e.target.value)}
                                    />
                                </div>

                                <div className="glass-card" style={{ padding: 24 }}>
                                    <h3
                                        style={{
                                            fontSize: 16,
                                            fontWeight: 700,
                                            marginBottom: 20,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        🛡️ Regras e Restrições
                                    </h3>

                                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                        <div>
                                            <label className="label">O que NÃO pode fazer (um por linha)</label>
                                            <textarea
                                                className="input-field"
                                                rows={3}
                                                placeholder="Fornecer informações médicas&#10;Dar conselhos financeiros"
                                                value={naoPodeFazer}
                                                onChange={(e) => setNaoPodeFazer(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Palavras a Evitar (separadas por vírgula)</label>
                                            <input
                                                className="input-field"
                                                placeholder="barato, concorrente, problema"
                                                value={palavrasEvitar}
                                                onChange={(e) => setPalavrasEvitar(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Regras Obrigatórias (uma por linha)</label>
                                            <textarea
                                                className="input-field"
                                                rows={3}
                                                placeholder="Sempre cumprimentar o cliente&#10;Perguntar nome antes de continuar"
                                                value={regrasObrigatorias}
                                                onChange={(e) => setRegrasObrigatorias(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Integrações (separadas por vírgula)</label>
                                            <input
                                                className="input-field"
                                                placeholder="CRM, ERP, WhatsApp"
                                                value={integracoes}
                                                onChange={(e) => setIntegracoes(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">LGPD / Compliance</label>
                                            <input
                                                className="input-field"
                                                placeholder="Requisitos legais específicos"
                                                value={lgpd}
                                                onChange={(e) => setLgpd(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">
                                                Métricas de Sucesso (uma por linha)
                                            </label>
                                            <textarea
                                                className="input-field"
                                                rows={2}
                                                placeholder="Tempo de resposta&#10;Satisfação do cliente"
                                                value={metricasSucesso}
                                                onChange={(e) => setMetricasSucesso(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action */}
                        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                            <button
                                className="btn-primary"
                                onClick={handleAnalisar}
                                disabled={loading || !nomeAgente || !nomeEmpresa}
                                style={{ padding: "14px 32px", fontSize: 15 }}
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner" />
                                        Analisando...
                                    </>
                                ) : (
                                    <>
                                        Analisar Dados
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === "resumo" && resumo && (
                    <motion.div
                        key="resumo"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <ResumoPreview resumo={resumo} />

                        <div
                            style={{
                                marginTop: 24,
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <button
                                className="btn-secondary"
                                onClick={() => setStep("form")}
                            >
                                <ArrowLeft size={16} />
                                Voltar
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleGerarPrompt}
                                disabled={loading}
                                style={{ padding: "14px 32px", fontSize: 15 }}
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner" />
                                        Gerando...
                                    </>
                                ) : (
                                    <>
                                        Gerar Prompt Final
                                        <Sparkles size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === "prompt" && promptFinal && qualidade && (
                    <motion.div
                        key="prompt"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <PromptPreview
                            prompt={promptFinal}
                            qualidade={qualidade}
                            onSave={handleSalvar}
                            saving={saving}
                        />

                        <div
                            style={{
                                marginTop: 24,
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <button
                                className="btn-secondary"
                                onClick={() => setStep("resumo")}
                            >
                                <ArrowLeft size={16} />
                                Voltar ao Resumo
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
