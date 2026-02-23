import { supabase } from "@/lib/supabaseClient";

export const FacultySettingsService = {
    /**
     * Get faculty profile and preferences
     */
    async getProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .rpc('get_faculty_profile_fs', { p_user_id: user.id });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }
    },

    /**
     * Update faculty profile details
     */
    async updateProfile(facultyId, { firstName, lastName, consultationHours, department, email }) {
        try {
            const { error } = await supabase
                .rpc('update_faculty_profile_fs', {
                    p_faculty_id: facultyId,
                    p_first_name: firstName,
                    p_last_name: lastName,
                    p_consultation_hours: consultationHours,
                    p_department: department,
                    p_email: email

                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },

    /**
     * Update notification preferences
     */
    async updatePreferences(facultyId, { emailEnabled, frequency }) {
        try {
            const { error } = await supabase
                .rpc('update_faculty_preferences_fs', {
                    p_faculty_id: facultyId,
                    p_email_enabled: emailEnabled,
                    p_frequency: frequency
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating preferences:', error);
            throw error;
        }
    }
};