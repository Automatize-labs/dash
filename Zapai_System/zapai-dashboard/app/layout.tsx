import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ZapAI - Gestão de Agentes IA',
  description: 'Dashboard para gerenciar agentes de IA multi-tenant',
}

import Sidebar from '@/components/Sidebar'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-[280px] transition-all duration-300">
            {/* Main Content Background Wrapper */}
            <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/20 via-[#0a0a0a] to-[#0a0a0a]">
              {children}
            </div>
          </main>
        </div>
        <Toaster position="top-right" richColors theme="dark" />
      </body>
    </html>
  )
}
