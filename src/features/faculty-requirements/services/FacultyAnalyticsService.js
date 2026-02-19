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
                .from('faculty_fs')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            if (!faculty) throw new Error('Faculty profile not found');

            const { data, error } = await supabase
                .rpc('get_faculty_analytics_overview_fs', { p_faculty_id: faculty.faculty_id });

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
    async getSubmissionTimeline(semester = null, academicYear = null) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: faculty } = await supabase
                .from('faculty_fs')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            const params = { p_faculty_id: faculty.faculty_id };
            if (semester) params.p_semester = semester;
            if (academicYear) params.p_academic_year = academicYear;

            const { data, error } = await supabase
                .rpc('get_faculty_submission_timeline_fs', params);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching timeline:', error);
            throw error;
        }
    },

    /**
     * Get on-time vs late submission statistics
     * RPC: get_faculty_ontime_stats_fs
     */
    async getOnTimeStats() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: faculty } = await supabase
                .from('faculty_fs')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            const { data, error } = await supabase
                .rpc('get_faculty_ontime_stats_fs', { p_faculty_id: faculty.faculty_id });

            if (error) throw error;
            return data || { on_time_count: 0, late_count: 0, total_count: 0, on_time_rate: 0 };
        } catch (error) {
            console.error('Error fetching on-time stats:', error);
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
                .rpc('get_faculty_submissions_fs', {
                    p_limit: 50,
                    p_offset: 0
                });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching submission history:', error);
            throw error;
        }
    },

    /**
     * Get course-by-course analytics (Reuse dashboard status for now)
     */
    async getCourseAnalytics() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data: faculty } = await supabase
                .from('faculty_fs')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            // Reusing the dashboard RPC as it has exactly what we need (submitted/total per course)
            const { data, error } = await supabase
                .rpc('get_faculty_courses_status_fs', { p_faculty_id: faculty.faculty_id });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching course analytics:', error);
            throw error;
        }
    }
};
