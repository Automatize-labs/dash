'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertOctagon } from 'lucide-react'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <html lang="pt-BR" className="dark">
            <body className={`${inter.className} bg-[#0a0a0a] text-white min-h-screen flex items-center justify-center`}>
                <div className="flex flex-col items-center text-center space-y-6 max-w-md p-8">
                    <div className="p-4 rounded-full bg-red-900/20 border border-red-900/40 animate-pulse">
                        <AlertOctagon size={64} className="text-red-500" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-white">Erro Crítico</h1>
                        <p className="text-slate-400">
                            Ocorreu um erro fatal na aplicação.
                        </p>
                        <p className="text-red-400 text-xs font-mono mt-4">
                            {error.message}
                        </p>
                    </div>

                    <Button onClick={() => reset()} variant="secondary" size="lg">
                        Recarregar Aplicação
                    </Button>
                </div>
            </body>
        </html>
    )
}
