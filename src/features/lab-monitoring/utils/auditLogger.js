import { supabase } from "@/lib/supabaseClient";

export const logAuditEvent = async ({ labName, actor, category, action, description, severity }) => {
    if (!labName) {
        console.warn("Attempted to log audit event without a labName", { action, description });
        return;
    }

    try {
        const { error } = await supabase
            .from('audit_logs_lm')
            .insert([{
                lab_name: labName,
                actor: actor,
                category: category,
                action: action,
                description: description,
                severity: severity
            }]);

        if (error) {
            console.error("Failed to insert audit log:", error);
        }
    } catch (err) {
        console.error("Exception during audit logging:", err);
    }
};
