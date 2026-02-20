import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-4">
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-slate-900 border border-slate-800">
                    <AlertCircle size={48} className="text-slate-500" />
                </div>
                <h2 className="text-2xl font-bold">Página não encontrada</h2>
                <p className="text-slate-400 max-w-md">
                    A página que você está procurando não existe ou foi movida.
                </p>
                <Link href="/dashboard">
                    <Button variant="outline" className="border-slate-800 hover:bg-slate-900 text-white">
                        Voltar para o Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    )
}
