import { supabase } from "@/lib/supabaseClient";

/**
 * Sends a violation-related email notification to a student via the
 * `send-violation-email` Supabase Edge Function.
 *
 * This is designed to be fire-and-forget — it never throws errors.
 * If the email fails, it logs to console but does not interrupt the calling workflow.
 *
 * @param {Object} params
 * @param {string} params.student_number - The student's ID number
 * @param {'new_violation'|'violation_updated'|'sanction_updated'} params.event_type - Type of event
 * @param {Object} params.details - Event-specific details for the email body
 */
export async function sendViolationNotification({ student_number, event_type, details }) {
    try {
        // Get the current session token for authorization
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(`${supabaseUrl}/functions/v1/send-violation-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': anonKey,
                ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
            },
            body: JSON.stringify({ student_number, event_type, details })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[Email Notification] HTTP ${response.status}:`, errText);
            return;
        }

        const data = await response.json();

        if (data?.sent) {
            console.log(`[Email Notification] ${event_type} email sent to ${data.email_sent_to}`);
        } else {
            console.log(`[Email Notification] Skipped:`, data?.message || 'Unknown reason');
        }
    } catch (err) {
        // Silently catch — email should never block the main workflow
        console.error('[Email Notification] Unexpected error:', err);
    }
}
