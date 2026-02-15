import { supabase } from "@/lib/supabaseClient";

export const FacultyAnalyticsService = {
    /**
     * Get overall analytics overview (Completion Rate, Dept Avg, etc.)
     * RPC: get_faculty_analytics_overview
     */
    async getAnalyticsOverview() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data: faculty } = await supabase
                .from('faculty')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            if (!faculty) throw new Error('Faculty profile not found');

            const { data, error } = await supabase
                .rpc('get_faculty_analytics_overview', { p_faculty_id: faculty.faculty_id });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching analytics overview:', error);
            throw error;
        }
    },

    /**
     * Get submission timeline data
     * RPC: get_faculty_submission_timeline
     */
    async getSubmissionTimeline() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: faculty } = await supabase
                .from('faculty')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            const { data, error } = await supabase
                .rpc('get_faculty_submission_timeline', { p_faculty_id: faculty.faculty_id });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching timeline:', error);
            throw error;
        }
    },

    /**
     * Get full submission history
     * RPC: get_faculty_submissions_fn
     */
    async getSubmissionHistory() {
        try {
            const { data, error } = await supabase
                .rpc('get_faculty_submissions_fn', {
                    p_limit: 50,
                    p_offset: 0
                });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching submission history:', error);
            throw error;
        }
    }
};
