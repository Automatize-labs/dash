"use client";

import { useState } from "react";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { apiExtractPdf } from "@/lib/api";
import { toast } from "sonner";

interface PDFUploadProps {
    onTextExtracted: (text: string) => void;
}

export default function PDFUpload({ onTextExtracted }: PDFUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [extracting, setExtracting] = useState(false);
    const [extracted, setExtracted] = useState(false);
    const [pages, setPages] = useState(0);

    const handleFile = async (selectedFile: File) => {
        setFile(selectedFile);
        setExtracting(true);

        try {
            const result = await apiExtractPdf(selectedFile);
            if (result.success) {
                onTextExtracted(result.text);
                setPages(result.pages);
                setExtracted(true);
                toast.success(`PDF extraído com sucesso! (${result.pages} páginas)`);
            }
        } catch {
            toast.error("Erro ao extrair PDF. Tente novamente.");
            setFile(null);
        }
        setExtracting(false);
    };

    const removeFile = () => {
        setFile(null);
        setExtracted(false);
        setPages(0);
        onTextExtracted("");
    };

    return (
        <div>
            {!file ? (
                <label
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "32px",
                        border: "2px dashed #2a2a3e",
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "all 0.3s",
                        background: "rgba(18,18,26,0.5)",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#8b5cf6";
                        e.currentTarget.style.background = "rgba(139,92,246,0.05)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#2a2a3e";
                        e.currentTarget.style.background = "rgba(18,18,26,0.5)";
                    }}
                >
                    <input
                        type="file"
                        accept=".pdf"
                        style={{ display: "none" }}
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFile(f);
                        }}
                    />
                    <Upload size={32} color="#64748b" style={{ marginBottom: 12 }} />
                    <p
                        style={{
                            color: "#94a3b8",
                            fontSize: 14,
                            fontWeight: 500,
                            marginBottom: 4,
                        }}
                    >
                        Clique ou arraste um arquivo PDF
                    </p>
                    <p style={{ color: "#64748b", fontSize: 12 }}>
                        Máximo 10MB — documentos, briefings, frameworks
                    </p>
                </label>
            ) : (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "16px",
                        background: extracted
                            ? "rgba(16,185,129,0.08)"
                            : "rgba(139,92,246,0.08)",
                        border: `1px solid ${extracted
                            ? "rgba(16,185,129,0.3)"
                            : "rgba(139,92,246,0.3)"
                            }`,
                        borderRadius: "12px",
                    }}
                >
                    {extracting ? (
                        <div className="spinner" />
                    ) : extracted ? (
                        <CheckCircle size={20} color="#10b981" />
                    ) : (
                        <FileText size={20} color="#8b5cf6" />
                    )}
                    <div style={{ flex: 1 }}>
                        <p
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#e2e8f0",
                            }}
                        >
                            {file.name}
                        </p>
                        <p style={{ fontSize: 12, color: "#94a3b8" }}>
                            {extracting
                                ? "Extraindo texto..."
                                : extracted
                                    ? `${pages} páginas extraídas`
                                    : "Processando..."}
                        </p>
                    </div>
                    <button
                        onClick={removeFile}
                        style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "#64748b",
                            padding: 4,
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}
