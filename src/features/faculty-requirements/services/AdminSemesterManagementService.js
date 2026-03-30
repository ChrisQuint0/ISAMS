import { supabase } from "@/lib/supabaseClient";

export const semesterService = {
    getSemesterSettings: async () => {
        const { data, error } = await supabase
            .from('systemsettings_fs')
            .select('setting_key, setting_value')
            .in('setting_key', ['current_semester', 'current_academic_year']);

        if (error) throw error;

        const settingsMap = data.reduce((acc, curr) => {
            acc[curr.setting_key] = curr.setting_value;
            return acc;
        }, {});

        return {
            semester: settingsMap.current_semester || '1st Semester',
            academic_year: settingsMap.current_academic_year || ''
        };
    },

    // Update active semester/academic year settings via upsert RPC
    updateSemesterSettings: async (settings) => {
        const promises = [];
        if (settings.semester) {
            promises.push(supabase.rpc('upsert_setting_fs', { p_key: 'current_semester', p_value: settings.semester }));
        }
        if (settings.academic_year) {
            promises.push(supabase.rpc('upsert_setting_fs', { p_key: 'current_academic_year', p_value: settings.academic_year }));
        }

        if (promises.length === 0) return;

        const results = await Promise.all(promises);
        const errors = results.filter(r => r.error);
        if (errors.length > 0) throw errors[0].error;
    },

    // Fetch semester history from the dedicated semester_history_fs table.
    // Also injects the currently active semester if not already recorded.
    getSemesterHistory: async () => {
        // Fetch all recorded semester history
        const { data: histData, error: histError } = await supabase
            .from('semester_history_fs')
            .select('academic_year, semester, status, closed_at')
            .order('academic_year', { ascending: false })
            .order('semester', { ascending: false });
        if (histError) throw histError;

        // Always inject the current active semester from settings
        const { data: settingsData } = await supabase
            .from('systemsettings_fs')
            .select('setting_key, setting_value')
            .in('setting_key', ['current_semester', 'current_academic_year']);

        const settingsMap = (settingsData || []).reduce((acc, r) => {
            acc[r.setting_key] = r.setting_value;
            return acc;
        }, {});

        const activeAY = settingsMap['current_academic_year'];
        const activeSem = settingsMap['current_semester'];

        const rows = histData || [];

        // Prepend active semester if it's not already in history
        const alreadyRecorded = rows.some(r => r.academic_year === activeAY && r.semester === activeSem);
        if (activeAY && activeSem && !alreadyRecorded) {
            rows.unshift({ academic_year: activeAY, semester: activeSem, status: 'ACTIVE', closed_at: null });
        }

        return rows;
    },

    // Fetch per-semester aggregated stats (faculty count, submissions, completion rate)
    getSemesterStats: async () => {
        const { data, error } = await supabase.rpc('get_semester_stats_fs');
        if (error) throw error;
        return data || [];
    },

    // Get list of faculty names who haven't reached 100% completion IN THE CURRENT SEMESTER ONLY
    getIncompleteFaculty: async () => {
        const { data, error } = await supabase.rpc('get_incomplete_faculty_current_semester_fs');
        if (error) throw error;

        return (data || []).map(row => row.full_name);
    },

    // Full Semester Rollover Protocol:
    //  1. Runs trigger_semester_rollover_fs (marks incompletes, archives, wipes holidays/notifications/deadlines)
    //  2. Updates system settings to the next period
    rolloverSemester: async (currentSemester, currentYear, nextSemester, nextYear) => {
        const { data, error } = await supabase.rpc('trigger_semester_rollover_fs', {
            p_current_semester: currentSemester,
            p_current_year: currentYear,
            p_next_semester: nextSemester,
            p_next_year: nextYear,
        });

        if (error) throw error;
        return data;
    }
};
