import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { ShieldX, Mail, RefreshCw, Lock } from "lucide-react";

// ─── Inactive Account Screen ────────────────────────────────────────────────
function InactiveAccountScreen({ email }) {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">

            {/* Animated background — same pulse-blob pattern as the global ISAMS login page */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -left-48 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
                <div
                    className="absolute bottom-1/4 -right-48 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: "1s" }}
                />
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: "2s" }}
                />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full text-center">

                {/* Icon cluster */}
                <div className="relative">
                    {/* Outer ring */}
                    <div className="w-28 h-28 rounded-full border border-red-900/50 bg-red-950/20
                        flex items-center justify-center">
                        {/* Inner ring */}
                        <div className="w-20 h-20 rounded-full border border-red-800/60 bg-red-950/30
                            flex items-center justify-center">
                            <ShieldX className="w-9 h-9 text-red-400" strokeWidth={1.5} />
                        </div>
                    </div>
                    {/* Lock badge */}
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full
                        bg-slate-900 border border-red-900/60
                        flex items-center justify-center">
                        <Lock className="w-3.5 h-3.5 text-red-500" />
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                        bg-red-500/10 border border-red-900/50 text-red-400 text-xs font-semibold tracking-widest uppercase">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        Account Suspended
                    </div>

                    <h1 className="text-2xl font-bold text-slate-100 mt-2">
                        Your account is currently inactive
                    </h1>

                    <p className="text-slate-400 text-sm leading-relaxed">
                        Access to the Faculty Submission Module has been suspended for your account.
                        If you believe this is a mistake, please reach out to your system administrator.
                    </p>
                </div>

                {/* Info card */}
                <div className="w-full rounded-xl border border-slate-800 bg-slate-900/60 p-4
                    backdrop-blur-sm divide-y divide-slate-800 text-left">
                    <div className="pb-3 flex items-start gap-3">
                        <Mail className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Affected Account</p>
                            <p className="text-sm text-slate-200 font-mono mt-0.5">{email || "—"}</p>
                        </div>
                    </div>
                    <div className="pt-3 flex items-start gap-3">
                        <RefreshCw className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">What to do</p>
                            <p className="text-sm text-slate-300 mt-0.5 leading-relaxed">
                                Contact your CCS Admin and provide your employee ID so they can reactivate your account in System Settings.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer note */}
                <p className="text-xs text-slate-600">
                    ISAMS · College of Computer Studies · Faculty Submission Module
                </p>
            </div>
        </div>
    );
}

// ─── Guard Component ─────────────────────────────────────────────────────────
export default function FacultyModuleGuard() {
    const { user } = useAuth();
    const [accessData, setAccessData] = useState(null);
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkModuleAccess = async () => {
            if (!user?.id) return;

            try {
                // Step 1: Check RBAC permissions
                const { data: rbac, error: rbacError } = await supabase
                    .from("user_rbac")
                    .select("facsub, facsub_role")
                    .eq("user_id", user.id)
                    .single();

                if (rbacError) throw rbacError;
                setAccessData(rbac);

                // Step 2: If they are faculty, also check is_active in faculty_fs
                if (rbac?.facsub && rbac?.facsub_role?.toLowerCase() === "faculty") {
                    const { data: facultyRow } = await supabase
                        .from("faculty_fs")
                        .select("is_active")
                        .eq("user_id", user.id)
                        .maybeSingle();

                    // If no row yet (new user) default to active; otherwise respect the flag
                    setIsActive(facultyRow ? facultyRow.is_active : true);
                }
            } catch (error) {
                console.error("Error fetching RBAC permissions:", error);
                setAccessData({ facsub: false, facsub_role: null });
            } finally {
                setLoading(false);
            }
        };

        checkModuleAccess();
    }, [user]);

    // 1. Invisible loading state — no white flash while querying Supabase
    if (loading) {
        return (
            <div className="bg-slate-950 h-screen w-screen"
                style={{ backgroundColor: "#020617" }} />
        );
    }

    // 2. No module access at all → back to main dashboard
    if (!accessData?.facsub) {
        return <Navigate to="/dashboard" replace />;
    }

    // 3. Faculty-specific: show inactive screen if account is suspended
    if (accessData.facsub_role?.toLowerCase() === "faculty" && !isActive) {
        return <InactiveAccountScreen email={user?.email} />;
    }

    // 4. Route by role
    if (accessData.facsub_role?.toLowerCase() === "admin") {
        return <Navigate to="/admin-dashboard" replace />;
    } else if (accessData.facsub_role?.toLowerCase() === "faculty") {
        return <Navigate to="/faculty-requirements/dashboard" replace />;
    }

    // 5. Fallback
    return <Navigate to="/dashboard" replace />;
}