import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth"; // Adjust path if necessary based on your project
import { supabase } from "@/lib/supabaseClient";

export default function FacultyModuleGuard() {
    const { user } = useAuth();
    const [accessData, setAccessData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkModuleAccess = async () => {
            if (!user?.id) return;

            try {
                // Query the universal RBAC table created by your leader
                const { data, error } = await supabase
                    .from("user_rbac")
                    .select("facsub, facsub_role")
                    .eq("user_id", user.id)
                    .single();

                if (error) throw error;
                setAccessData(data);
            } catch (error) {
                console.error("Error fetching RBAC permissions:", error);
                // Default to no access if the query fails
                setAccessData({ facsub: false, facsub_role: null });
            } finally {
                setLoading(false);
            }
        };

        checkModuleAccess();
    }, [user]);

    // 1. Show a loading state while querying Supabase
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-lg text-gray-500">Checking module permissions...</p>
            </div>
        );
    }

    // 2. Check if the user has access to the Faculty Submission Module at all
    if (!accessData?.facsub) {
        // If facsub is false, kick them back to the main ISAMS dashboard
        return <Navigate to="/dashboard" replace />;
    }

    // 3. Route automatically based on their specific role in this module
    if (accessData.facsub_role === "admin") {
        return <Navigate to="/admin-dashboard" replace />;
    } else if (accessData.facsub_role === "faculty") {
        return <Navigate to="/faculty-requirements/dashboard" replace />;
    }

    // 4. Fallback: If they have access but no role is defined, return to dashboard
    return <Navigate to="/dashboard" replace />;
}