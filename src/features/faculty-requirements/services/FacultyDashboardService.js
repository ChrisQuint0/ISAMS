import { supabase } from '@/lib/supabaseClient';

export const FacultyDashboardService = {
    /**
     * Fetch dashboard statistics (overall progress, pending count, days remaining)
     * Uses RPC: get_faculty_dashboard_stats
     */
    async getDashboardStats() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Get faculty_id from user_id
            const { data: faculty, error: facultyError } = await supabase
                .from('faculty')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            if (facultyError) throw facultyError;

            const { data, error } = await supabase
                .rpc('get_faculty_dashboard_stats', { p_faculty_id: faculty.faculty_id });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    },

    /**
     * Fetch status of all courses assigned to the faculty
     * Uses RPC: get_faculty_courses_status
     */
    async getCoursesStatus() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data: faculty, error: facultyError } = await supabase
                .from('faculty')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            if (facultyError) throw facultyError;

            const { data, error } = await supabase
                .rpc('get_faculty_courses_status', { p_faculty_id: faculty.faculty_id });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching courses status:', error);
            throw error;
        }
    },

    /**
     * Fetch recent submission activity
     * Uses RPC: get_faculty_recent_activity
     */
    async getRecentActivity() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data: faculty, error: facultyError } = await supabase
                .from('faculty')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            if (facultyError) throw facultyError;

            const { data, error } = await supabase
                .rpc('get_faculty_recent_activity', { p_faculty_id: faculty.faculty_id });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            throw error;
        }
    }
};
