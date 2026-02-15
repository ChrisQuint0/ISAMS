import { supabase } from "@/lib/supabaseClient";

export const FacultyResourceService = {
    /**
     * Get available document templates
     * Uses RPC: get_available_templates
     */
    async getTemplates() {
        try {
            const { data, error } = await supabase
                .rpc('get_available_templates');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching templates:', error);
            throw error;
        }
    },

    /**
     * Download a specific template file
     * (Mock implementation for now, or use real storage URL)
     */
    async downloadTemplate(templateId) {
        try {
            // In a real app, this would get a signed URL from Supabase Storage
            const { data, error } = await supabase
                .from('templates')
                .select('file_url')
                .eq('template_id', templateId)
                .single();

            if (error) throw error;
            return data.file_url;
        } catch (error) {
            console.error('Error downloading template:', error);
            throw error;
        }
    },

    /**
     * Get archived submissions (filtered by semester/year if needed)
     * Reusing common submission queries but filtering for historical data
     */
    async getArchivedSubmissions(semester, academicYear) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data: faculty } = await supabase
                .from('faculty')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            let query = supabase
                .from('submissions')
                .select(`
          submission_id,
          standardized_filename,
          submitted_at,
          courses (course_code, course_name),
          document_types (type_name)
        `)
                .eq('faculty_id', faculty.faculty_id)
                .eq('submission_status', 'ARCHIVED'); // Assuming we have an ARCHIVED status

            if (semester) query = query.eq('semester', semester);
            if (academicYear) query = query.eq('academic_year', academicYear);

            const { data, error } = await query;

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching archives:', error);
            throw error;
        }
    }
};
