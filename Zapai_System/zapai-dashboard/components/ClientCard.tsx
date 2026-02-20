'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Trash2, MessageSquare, Users, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ClientCardProps {
    client: any
}

export default function ClientCard({ client }: ClientCardProps) {
    const router = useRouter()
    const [deleting, setDeleting] = useState(false)

    const handleDelete = async () => {
        setDeleting(true)
        try {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', client.id)

            if (error) throw error

            toast.success('Cliente removido')
            router.refresh()
        } catch (error: any) {
            toast.error('Erro ao remover cliente')
            console.error(error)
        } finally {
            setDeleting(false)
        }
    }

    const isActive = client.active
    const hasConfig = client.agent_configs?.length > 0

    return (
        <Card className="glass-card group hover:scale-[1.02] transition-all duration-300 border-white/5 overflow-hidden relative">
            {/* Active Indicator Glow */}
            {isActive && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 blur-3xl -mr-10 -mt-10 pointer-events-none" />
            )}

            <CardHeader className="pb-3 relative">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg font-semibold text-white group-hover:text-blue-200 transition-colors">
                                {client.name}
                            </CardTitle>
                            {isActive ? (
                                <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            ) : (
                                <span className="flex h-2 w-2 rounded-full bg-slate-600" />
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-black/20 px-2 py-1 rounded w-fit">
                            <span>ID:</span>
                            <span className="text-slate-300">{client.client_id}</span>
                        </div>
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10 -mt-1 -mr-1"
                            >
                                <Trash2 size={16} />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-panel border-red-900/20">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400">
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente
                                    <strong className="text-white"> {client.name}</strong> e todas as suas configurações.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 border-0 text-white">
                                    Excluir
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardHeader>

            <CardContent>
                <div className="space-y-4">
                    {/* Metrics Mockup (Could be real if we fetch it) */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-white/5">
                        <div className="text-center">
                            <div className="flex items-center justify-center text-slate-500 mb-1">
                                <MessageSquare size={14} />
                            </div>
                            <span className="text-sm font-medium text-white">-</span>
                        </div>
                        <div className="text-center border-l border-white/5">
                            <div className="flex items-center justify-center text-slate-500 mb-1">
                                <Users size={14} />
                            </div>
                            <span className="text-sm font-medium text-white">-</span>
                        </div>
                        <div className="text-center border-l border-white/5">
                            <div className="flex items-center justify-center text-slate-500 mb-1">
                                <Activity size={14} />
                            </div>
                            <span className="text-xs font-medium text-emerald-400">
                                {client.industry || 'N/A'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                        <div className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded-full ${hasConfig ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20'}`}>
                            {hasConfig ? (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                    Configurado
                                </>
                            ) : (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                                    Pendente
                                </>
                            )}
                        </div>

                        <Link href={`/dashboard/${client.client_id}`} className="flex-1 max-w-[50%]">
                            <Button className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20">
                                <Settings size={14} className="mr-2" />
                                <span className="text-xs">Gerenciar</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
