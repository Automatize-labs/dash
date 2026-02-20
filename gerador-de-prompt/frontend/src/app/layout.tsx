import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZapPrompt – Gerador de Prompts Profissional",
  description:
    "Crie system prompts profissionais para agentes de IA com análise inteligente, validação de qualidade e templates otimizados.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#12121a",
              border: "1px solid #2a2a3e",
              color: "#e2e8f0",
            },
          }}
        />
      </body>
    </html>
  );
}
