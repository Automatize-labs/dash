'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-4">
            <div className="flex flex-col items-center text-center space-y-6 max-w-md">
                <div className="p-4 rounded-full bg-red-900/20 border border-red-900/40">
                    <AlertTriangle size={48} className="text-red-500" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-red-100">Algo deu errado!</h2>
                    <p className="text-red-200/60 text-sm font-mono bg-red-950/30 p-4 rounded-lg border border-red-900/20 break-all">
                        {error.message || "Erro desconhecido ao carregar a página."}
                    </p>
                </div>

                <div className="flex gap-4">
                    <Button
                        onClick={() => reset()}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        <RefreshCcw size={16} className="mr-2" />
                        Tentar novamente
                    </Button>
                </div>
            </div>
        </div>
    )
}
