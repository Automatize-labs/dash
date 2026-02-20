import { Zap } from 'lucide-react'

export default function Loading() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-[#0a0a0a]">
            <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-blue-500/30 blur-3xl rounded-full" />

                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 animate-bounce">
                        <Zap className="text-white fill-white w-8 h-8" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="h-1.5 w-32 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 w-1/2 animate-[shimmer_1s_infinite_linear]" />
                        </div>
                        <p className="text-xs text-slate-500 font-medium tracking-wider animate-pulse">CARREGANDO ZAPAI...</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
