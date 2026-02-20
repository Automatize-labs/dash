"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import type { User } from "@supabase/supabase-js";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
                router.replace("/login");
                return;
            }

            setUser(session.user);
            setLoading(false);
        };

        getUser();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                router.replace("/login");
            } else {
                setUser(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, [router, supabase.auth]);

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    background: "#0a0a0f",
                }}
            >
                <div className="spinner" style={{ width: 40, height: 40 }} />
            </div>
        );
    }

    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <main
                style={{
                    flex: 1,
                    padding: "32px",
                    overflowY: "auto",
                    background:
                        "radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.04) 0%, transparent 50%)",
                }}
            >
                {children}
            </main>
        </div>
    );
}
