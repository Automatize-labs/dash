
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Papa from 'papaparse';

// Configure PDF.js worker
// We use a CDN to avoid complex build configurations with Next.js/Webpack
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export type ParsedFile = {
    title: string;
    content: string;
    type: 'pdf' | 'docx' | 'csv' | 'txt' | 'md';
};

export async function parseFile(file: File): Promise<ParsedFile> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    let content = '';

    try {
        switch (extension) {
            case 'pdf':
                content = await parsePDF(file);
                break;
            case 'docx':
                content = await parseDOCX(file);
                break;
            case 'csv':
                content = await parseCSV(file);
                break;
            case 'txt':
            case 'md':
            case 'json':
                content = await parseText(file);
                break;
            default:
                throw new Error(`Formato .${extension} não suportado.`);
        }
    } catch (error: any) {
        console.error("Error parsing file:", error);
        throw new Error(`Erro ao ler arquivo: ${error.message}`);
    }

    // Clean up content
    content = content.trim();

    return {
        title: file.name,
        content,
        type: extension as any
    };
}

async function parseText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

async function parsePDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
        fullText += `[Página ${i}]\n${pageText}\n\n`;
    }

    return fullText;
}

async function parseDOCX(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

async function parseCSV(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            complete: (results) => {
                // Convert array of arrays to string
                const text = results.data
                    .map((row: any) => row.join(', '))
                    .join('\n');
                resolve(text);
            },
            error: (error) => reject(error),
            header: false // Read as arrays to keep it simple
        });
    });
}
