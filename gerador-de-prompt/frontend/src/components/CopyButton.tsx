"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface CopyButtonProps {
    text: string;
    label?: string;
}

export default function CopyButton({ text, label = "Copiar" }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success("Copiado para a área de transferência!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Erro ao copiar");
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={copied ? "btn-secondary" : "btn-primary"}
            style={{
                padding: "10px 20px",
                fontSize: 13,
                gap: 6,
            }}
        >
            {copied ? (
                <>
                    <Check size={14} />
                    Copiado!
                </>
            ) : (
                <>
                    <Copy size={14} />
                    {label}
                </>
            )}
        </button>
    );
}
