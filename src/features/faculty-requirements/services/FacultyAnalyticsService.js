import { supabase } from "@/lib/supabaseClient";

export const FacultyAnalyticsService = {
    /**
     * Helper to fetch dropdown options dynamically based on the current faculty's courses
     */
    getOptions: async () => {
        try {
            const [semesterPeriods, systemSettings] = await Promise.all([
                // All historical + active semesters from semester management
                supabase.from('semester_history_fs').select('academic_year, semester, status').order('created_at', { ascending: false }),
                // Current active semester from system settings
                supabase.from('systemsettings_fs').select('setting_key, setting_value').in('setting_key', ['current_semester', 'current_academic_year'])
            ]);

            // Build current active semester from system settings
            const settingsMap = {};
            (systemSettings.data || []).forEach(s => { settingsMap[s.setting_key] = s.setting_value; });
            const currentSemester = settingsMap['current_semester'];
            const currentAcademicYear = settingsMap['current_academic_year'];

            // Build semester periods array with status labels
            const historicalPeriods = (semesterPeriods.data || []).map(p => ({
                academic_year: p.academic_year,
                semester: p.semester,
                status: p.status === 'COMPLETED' ? 'Completed' : 'Active'
            }));

            // If current active semester isn't already in history, add it at the top
            const isCurrentInHistory = historicalPeriods.some(
                p => p.academic_year === currentAcademicYear && p.semester === currentSemester
            );
            if (currentSemester && currentAcademicYear && !isCurrentInHistory) {
                historicalPeriods.unshift({
                    academic_year: currentAcademicYear,
                    semester: currentSemester,
                    status: 'Active'
                });
            }

            const uniqueSemesters = [...new Set(historicalPeriods.map(p => p.semester))].filter(Boolean);
            const uniqueYears = [...new Set(historicalPeriods.map(p => p.academic_year))].filter(Boolean);

            return {
                semesters: uniqueSemesters,
                academic_years: uniqueYears,
                semesterPeriods: historicalPeriods,
                currentSemester,
                currentAcademicYear
            };
        } catch (error) {
            console.error('Error fetching analytics options:', error);
            return { semesters: [], academic_years: [], semesterPeriods: [], currentSemester: null, currentAcademicYear: null };
        }
    },

    /**
     * Get overall analytics overview (Completion Rate, Dept Avg, etc.)
     * RPC: get_faculty_analytics_overview
     */
    async getAnalyticsOverview(semester = null, academicYear = null) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data: faculty } = await supabase
                .from('faculty_fs')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            if (!faculty) throw new Error('Faculty profile not found');

            const params = { p_faculty_id: faculty.faculty_id };
            if (semester) params.p_semester = semester;
            if (academicYear) params.p_academic_year = academicYear;

            const { data, error } = await supabase
                .rpc('get_faculty_analytics_overview_fs', params);

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
    async getOnTimeStats(semester = null, academicYear = null) {
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
                .rpc('get_faculty_ontime_stats_fs', params);

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
    async getSubmissionHistory(semester = null, academicYear = null) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: faculty } = await supabase
                .from('faculty_fs')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            const params = {
                p_faculty_id: faculty.faculty_id,
                p_limit: 50,
                p_offset: 0
            };
            if (semester) params.p_semester = semester;
            if (academicYear) params.p_academic_year = academicYear;

            const { data, error } = await supabase
                .rpc('get_faculty_submissions_fs', params);

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
    async getCourseAnalytics(semester = null, academicYear = null) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data: faculty } = await supabase
                .from('faculty_fs')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            const params = { p_faculty_id: faculty.faculty_id };
            if (semester) params.p_semester = semester;
            if (academicYear) params.p_academic_year = academicYear;

            // Reusing the dashboard RPC as it has exactly what we need (submitted/total per course)
            const { data, error } = await supabase
                .rpc('get_faculty_courses_status_fs', params);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching course analytics:', error);
            throw error;
        }
    }
};
