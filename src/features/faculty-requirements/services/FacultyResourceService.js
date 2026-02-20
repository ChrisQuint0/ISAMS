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
                    original_filename,
                    gdrive_download_link,
                    gdrive_web_view_link,
                    documenttypes_fs (type_name),
                    courses_fs!inner (semester, academic_year)
                `)
                .eq('faculty_id', faculty.faculty_id)
                // FIX: Removed the undefined .eq('course_id', courseId) that was causing crashes
                .eq('submission_status', 'ARCHIVED');

            if (semester) query = query.eq('courses_fs.semester', semester);
            if (academicYear) query = query.eq('courses_fs.academic_year', academicYear);

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
    /**
     * Download all documents for a course (ZIP) routed through Node backend
     */
    async downloadAllDocuments(courseId, semester, academicYear) {
        try {
            // 1. Fetch all submissions for this course + faculty safely via Supabase
            const { data: { user } } = await supabase.auth.getUser();
            const { data: faculty } = await supabase
                .from('faculty_fs')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            let query = supabase
                .from('submissions_fs')
                .select(`
                    submission_id,
                    original_filename,
                    gdrive_download_link,
                    gdrive_web_view_link,
                    documenttypes_fs (type_name)
                `)
                .eq('faculty_id', faculty.faculty_id)
                .eq('course_id', courseId) // FIX: Added missing course filter so it doesn't download everything!
                .eq('submission_status', 'ARCHIVED');

            if (semester) query = query.eq('courses_fs.semester', semester);
            if (academicYear) query = query.eq('courses_fs.academic_year', academicYear);

            const { data: files, error } = await query;
            if (error) throw error;
            if (!files || files.length === 0) return { success: false, message: "No files found to download." };

            // 2. Map the files into a clean payload for the backend
            const payloadFiles = files.map(file => {
                const docType = file.documenttypes_fs?.type_name || 'Uncategorized';
                const filename = file.original_filename || `document_${file.submission_id}`;

                // Extract just the ID from the Drive link
                const fileIdMatch = file.gdrive_download_link?.match(/id=([^&]+)/);

                return {
                    folder: docType,
                    filename: filename,
                    fileId: fileIdMatch ? fileIdMatch[1] : null,
                    fallbackLink: file.gdrive_web_view_link
                };
            });

            // 3. POST the payload to your Node server
            const response = await fetch('http://localhost:3000/api/faculty/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, files: payloadFiles })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Export failed on server');
            }

            // 4. Receive the ZIP stream and trigger browser download
            const blob = await response.blob();
            const folderName = `Course_Archive_${courseId}_${new Date().toISOString().slice(0, 10)}.zip`;
            saveAs(blob, folderName);

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
