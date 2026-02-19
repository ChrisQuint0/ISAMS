import { supabase } from "@/lib/supabaseClient";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
    /**
     * Download all documents for a course (ZIP)
     */
    async downloadAllDocuments(courseId, semester, academicYear) {
        try {
            // 1. Fetch all submissions for this course + faculty
            const { data: { user } } = await supabase.auth.getUser();
            const { data: faculty } = await supabase
                .from('faculty_fs')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            let query = supabase
                .from('submissions_fs')
                .select(`
                    original_filename,
                    gdrive_download_link,
                    gdrive_web_view_link,
                    documenttypes_fs (type_name)
                `)
                .eq('faculty_id', faculty.faculty_id)
                .eq('course_id', courseId)
                .eq('submission_status', 'ARCHIVED'); // Only archived? Or all? Usually archive page implies archived.

            if (semester) query = query.eq('semester', semester);
            if (academicYear) query = query.eq('academic_year', academicYear);

            const { data: files, error } = await query;
            if (error) throw error;
            if (!files || files.length === 0) return { success: false, message: "No files found to download." };

            // 2. Init JSZip
            const zip = new JSZip();
            const folderName = `Course_Archive_${courseId}_${new Date().toISOString().slice(0, 10)}`;
            const folder = zip.folder(folderName);

            // 3. Fetch each file and add to ZIP
            const fetchFile = async (file) => {
                const fileName = file.original_filename || `doc_${Math.random().toString(36).substr(2, 9)}`;
                const docType = file.documenttypes_fs?.type_name || 'Uncategorized';
                // Try to fetch blob. If CORS fails, add a text file with link.
                try {
                    // Try fetch via proxy if available, or direct.
                    // Assuming gdrive_download_link might work or we use a proxy endpoint.
                    // Since we don't have a specific proxy for download in the snippet, we try direct.
                    const response = await fetch(file.gdrive_download_link);
                    if (!response.ok) throw new Error('Network response was not ok');
                    const blob = await response.blob();
                    folder.file(`${docType}/${fileName}`, blob);
                } catch (e) {
                    console.warn(`Failed to download ${fileName}, adding link file instead.`, e);
                    folder.file(`${docType}/${fileName}.url.txt`, `File could not be downloaded directly due to browser restrictions.\nDownload link: ${file.gdrive_web_view_link}`);
                }
            };

            await Promise.all(files.map(fetchFile));

            // 4. Generate ZIP
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `${folderName}.zip`);

            return { success: true, message: "Download started." };

        } catch (error) {
            console.error('Error downloading all documents:', error);
            throw error;
        }
    },

    /**
     * Get version history for a specific submission
     * RPC: get_document_versions_fs
     */
    async getDocumentVersions(submissionId) {
        try {
            const { data, error } = await supabase
                .rpc('get_document_versions_fs', { p_submission_id: submissionId });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching document versions:', error);
            throw error;
        }
    },

    /**
     * Get FAQs
     * RPC: get_faqs_fs
     */
    async getFAQs() {
        try {
            const { data, error } = await supabase.rpc('get_faqs_fs');
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching FAQs:', error);
            throw error;
        }
    },

    /**
     * Get Template Categories
     * RPC: get_template_categories_fs
     */
    async getTemplateCategories() {
        try {
            const { data, error } = await supabase.rpc('get_template_categories_fs');
            if (error) throw error;
            return data ? data.map(c => c.category) : []; // Return array of strings
        } catch (error) {
            console.error('Error fetching template categories:', error);
            throw error;
        }
    }
};
