import { Sidebar } from "@/components/Sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden relative">
                {/* Background gradient effect */}
                <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
                <div className="absolute -top-[200px] -right-[200px] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-[200px] -left-[200px] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                <main className="flex-1 overflow-auto p-6 relative z-10">
                    {children}
                </main>
            </div>
        </div>
    )
}
