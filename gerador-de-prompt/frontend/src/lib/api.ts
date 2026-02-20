const MODAL_API_URL = process.env.NEXT_PUBLIC_MODAL_API_URL || "";

export async function apiExtractPdf(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${MODAL_API_URL}/api/extract-pdf`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) throw new Error("Erro ao extrair PDF");
    return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiAnalisar(data: {
    form_data: Record<string, any>;
    pdf_text?: string;
    framework?: string;
}) {
    const res = await fetch(`${MODAL_API_URL}/api/analisar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Erro ao analisar dados");
    return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiGerarPrompt(data: {
    resumo: Record<string, any>;
    template_customizado?: string;
}) {
    const res = await fetch(`${MODAL_API_URL}/api/gerar-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Erro ao gerar prompt");
    return res.json();
}

export async function apiSalvarPrompt(data: Record<string, unknown>) {
    const res = await fetch(`${MODAL_API_URL}/api/salvar-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Erro ao salvar prompt");
    return res.json();
}

export async function apiListarPrompts(userId: string) {
    const res = await fetch(`${MODAL_API_URL}/api/prompts/${userId}`);
    if (!res.ok) throw new Error("Erro ao listar prompts");
    return res.json();
}

export async function apiGetPrompt(promptId: string) {
    const res = await fetch(`${MODAL_API_URL}/api/prompt/${promptId}`);
    if (!res.ok) throw new Error("Erro ao buscar prompt");
    return res.json();
}

export async function apiDeletarPrompt(promptId: string) {
    const res = await fetch(`${MODAL_API_URL}/api/prompt/${promptId}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Erro ao deletar prompt");
    return res.json();
}
