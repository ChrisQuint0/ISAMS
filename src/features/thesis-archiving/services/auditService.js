import { supabase } from "@/lib/supabaseClient";

export const auditService = {
    /**
     * Record a Login event for a thesis archiving user.
     * Called only after confirming the user has the `thesis` RBAC flag.
     * @param {{ userId: string, actorName: string }} param0
     */
    async logLogin({ userId, actorName }) {
        try {
            const userAgent = navigator.userAgent;
            const { error } = await supabase
                .from("ta_audit_logs")
                .insert([{
                    actor_user_id: userId,
                    actor_name: actorName,
                    action: "Login",
                    description: `${actorName} logged in to Thesis Archiving`,
                    module_affected: "Thesis Archiving",
                    record_id: null,
                    record_type: null,
                    old_values: null,
                    new_values: null,
                    ip_address: null,
                    user_agent: userAgent,
                }]);

            if (error) {
                console.error("[AuditService] Failed to log login:", error);
            }
        } catch (err) {
            console.error("[AuditService] Unexpected error logging login:", err);
        }
    },

    /**
     * Fetch activity logs from the vw_audit_trail view
     * @param {Object} filters - Search and filter parameters
     */
    async getLogs(filters = {}) {
        let query = supabase
            .from("vw_audit_trail")
            .select("*");

        // Action Filter
        if (filters.action && filters.action !== 'all') {
            query = query.eq('action', filters.action);
        }

        // Search Filter (Across name, description, module_affected)
        if (filters.search) {
            const searchTerm = `%${filters.search}%`;
            query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm},module_affected.ilike.${searchTerm}`);
        }

        // Date Filter
        if (filters.date) {
            // Compare as date
            query = query.gte('time', `${filters.date}T00:00:00Z`)
                         .lte('time', `${filters.date}T23:59:59Z`);
        }

        const { data, error } = await query.order("time", { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Fetch unique actions from vw_audit_trail for filters
     */
    async getUniqueActions() {
        const { data, error } = await supabase
            .from("vw_audit_trail")
            .select("action")
            .order("action");

        if (error) throw error;
        
        // Get unique values manually since select('action', { count: 'exact', distinct: true }) 
        // behavior can be inconsistent across Supabase versions/views.
        const uniqueActions = [...new Set(data.map(item => item.action))].filter(Boolean);
        return uniqueActions;
    }
};
