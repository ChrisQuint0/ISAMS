import { supabase } from "@/lib/supabaseClient";

export const semesterService = {
    /**
     * Fetch current active semester and academic year settings
     */
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

    /**
     * Update active semester/academic year settings
     */
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

    /**
     * Derive semi-historical list of semesters from existing courses
     */
    getSemesterHistory: async () => {
        // We pull from courses_fs to see which semesters have been active
        const { data, error } = await supabase
            .from('courses_fs')
            .select('semester, academic_year')
            .order('academic_year', { ascending: false })
            .order('semester', { ascending: false });

        if (error) throw error;

        // Filter unique pairs to build the history list
        const unique = [];
        const seen = new Set();
        (data || []).forEach(item => {
            if (!item.semester || !item.academic_year) return;
            const key = `${item.semester}|${item.academic_year}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push({
                    semester: item.semester,
                    academic_year: item.academic_year
                });
            }
        });

        return unique;
    },

    /**
     * Get list of faculty names who have haven't reached 100% completion
     */
    getIncompleteFaculty: async () => {
        // Using the management RPC which calculates completion_rate
        const { data, error } = await supabase.rpc('get_faculty_management_fs');
        if (error) throw error;

        return (data || [])
            .filter(f => parseFloat(f.completion_rate || '0') < 100)
            .map(f => `${f.first_name} ${f.last_name}`);
    },

    /**
     * Triggers the archival of current semester and updates settings to the next period
     */
    rolloverSemester: async (currentSemester, currentYear, nextSemester, nextYear) => {
        // 1. Archive current semester submissions
        const { data, error } = await supabase.rpc('reset_semester_fs', {
            p_target_semester: currentSemester,
            p_target_year: currentYear
        });

        if (error) throw error;

        // 2. Update settings to the new period
        await semesterService.updateSemesterSettings({
            semester: nextSemester,
            academic_year: nextYear
        });

        // 3. Clear deadlines for the new semester (Deadlines are semester-specific)
        // We don't have a specific "clear deadlines" RPC that ignores safety, 
        // but the system design implies deadlines are created fresh per semester.

        return data; // Returns the success message from reset_semester_fs
    }
};
