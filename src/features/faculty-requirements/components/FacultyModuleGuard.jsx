import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { ShieldX, Mail, CheckCircle, Lock } from "lucide-react";

// Inactive Account Screen
function InactiveAccountScreen({ email }) {
    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 relative overflow-hidden">

            {/* Background Decor - Replicating LoginPage layout with Red (Destructive) theme */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Top-left glow */}
                <div
                    className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-pulse opacity-20"
                    style={{ background: 'var(--destructive)' }}
                />
                {/* Bottom-right glow */}
                <div
                    className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-pulse opacity-20"
                    style={{ background: 'var(--destructive)', animationDelay: "1s" }}
                />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full text-center">

                {/* Icon cluster */}
                <div className="relative">
                    {/* Outer ring - Neutral 200 */}
                    <div className="w-28 h-28 rounded-full border border-neutral-200 bg-white shadow-sm
                        flex items-center justify-center">
                        {/* Inner ring - Neutral 100 */}
                        <div className="w-20 h-20 rounded-full border border-neutral-200 bg-neutral-100
                            flex items-center justify-center">
                            {/* Icon - Destructive */}
                            <ShieldX className="w-9 h-9 text-destructive" strokeWidth={1.5} />
                        </div>
                    </div>
                    {/* Lock badge - Neutral 900 with Destructive icon */}
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full
                        bg-neutral-900 border-2 border-white shadow-sm
                        flex items-center justify-center">
                        <Lock className="w-3.5 h-3.5 text-destructive" />
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-3">
                    {/* Badge using Destructive to signify suspended state */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                        bg-destructive/10 border border-destructive/30 text-destructive text-[10px] font-bold tracking-widest uppercase">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                        Account Suspended
                    </div>

                    <h1 className="text-2xl font-bold text-neutral-900 mt-2">
                        Your account is currently inactive
                    </h1>

                    <p className="text-neutral-500 text-sm leading-relaxed px-4">
                        Access to the Faculty Submission Module has been suspended for your account.
                        Please reach out to your system administrator for assistance.
                    </p>
                </div>

                {/* Info card - Institutional Style */}
                <div className="w-full rounded-xl border border-neutral-200 bg-white p-4 shadow-sm
                    divide-y divide-neutral-200 text-left">
                    <div className="pb-3 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                            <Mail className="w-4 h-4 text-neutral-500" />
                        </div>
                        <div>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Affected Account</p>
                            <p className="text-sm text-neutral-900 font-medium mt-0.5">{email || "—"}</p>
                        </div>
                    </div>
                    <div className="pt-3 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-4 h-4 text-neutral-500" />
                        </div>
                        <div>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">What to do</p>
                            <p className="text-sm text-neutral-900 mt-0.5 leading-relaxed">
                                Provide your employee ID to the Admin to reactivate your account in System Settings.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer note */}
                <p className="text-[10px] text-neutral-400 font-medium tracking-wide uppercase">
                    ISAMS · Faculty Submission Module
                </p>
            </div>
        </div>
    );
}

// Guard Component
export default function FacultyModuleGuard() {
    const { user } = useAuth();
    const [accessData, setAccessData] = useState(null);
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkModuleAccess = async () => {
            if (!user?.id) return;

            try {
                // Check RBAC permissions
                const { data: rbac, error: rbacError } = await supabase
                    .from("user_rbac")
                    .select("facsub, facsub_role")
                    .eq("user_id", user.id)
                    .single();

                if (rbacError) throw rbacError;
                setAccessData(rbac);

                // If they are faculty, also check is_active in faculty_fs
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

    // Invisible loading state
    if (loading) {
        return (
            <div className="bg-neutral-50 h-screen w-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // No module access at all > back to main dashboard
    if (!accessData?.facsub) {
        return <Navigate to="/dashboard" replace />;
    }

    // Faculty-specific: show inactive screen if account is suspended
    if (accessData.facsub_role?.toLowerCase() === "faculty" && !isActive) {
        return <InactiveAccountScreen email={user?.email} />;
    }

    // Route by role
    if (accessData.facsub_role?.toLowerCase() === "admin") {
        return <Navigate to="/admin-dashboard" replace />;
    } else if (accessData.facsub_role?.toLowerCase() === "faculty") {
        return <Navigate to="/faculty-requirements/dashboard" replace />;
    }

    // Fallback
    return <Navigate to="/dashboard" replace />;
}