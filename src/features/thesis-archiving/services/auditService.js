import { supabase } from "@/lib/supabaseClient";

export const auditService = {
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
    }
};
