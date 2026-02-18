import { supabase } from "@/lib/supabaseClient";

export const FacultyResourceService = {
    /**
     * Get available document templates
     * Uses RPC: get_available_templates
     */
    async getTemplates() {
        try {
            const { data, error } = await supabase
                .rpc('get_available_templates_fs');

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
                .from('templates_fs')
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
                .from('faculty_fs')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            let query = supabase
                .from('submissions_fs')
                .select(`
          submission_id,
          standardized_filename,
          submitted_at,
          courses_fs (course_code, course_name),
          documenttypes_fs (type_name)
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
    },
    async getArchivedCourses(semester) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: faculty } = await supabase
                .from('faculty_fs')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            const { data, error } = await supabase
                .rpc('get_faculty_archived_courses_fs', {
                    p_faculty_id: faculty.faculty_id,
                    p_semester: semester
                });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching archived courses:', error);
            throw error;
        }
    },

    async getCourseVersions(courseId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: faculty } = await supabase
                .from('faculty_fs')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            const { data, error } = await supabase
                .rpc('get_course_submissions_archive_fs', {
                    p_faculty_id: faculty.faculty_id,
                    p_course_id: courseId
                });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching course versions:', error);
            throw error;
        }
    },

    /**
     * Download all documents for a course (ZIP)
     * Mocking this for now as it requires backend generation
     */
    async downloadAllDocuments(courseId) {
        try {
            // In real implementation: Call RPC or Edge Function to generate ZIP and return URL
            // const { data, error } = await supabase.functions.invoke('generate-course-zip', { body: { courseId } });

            // Mock delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            return { success: true, message: "ZIP generation initiated. Check email for download link." };
        } catch (error) {
            console.error('Error downloading all documents:', error);
            throw error;
        }
    }
};
