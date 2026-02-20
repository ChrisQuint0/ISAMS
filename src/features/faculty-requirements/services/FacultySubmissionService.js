import { supabase } from "@/lib/supabaseClient";
import Tesseract from 'tesseract.js';
import { getFolderLink, getFolderId, uploadToGDrive } from './gdriveSettings';

export const FacultySubmissionService = {
    /**
     * Get required documents for a specific course
     */
    async getRequiredDocs(courseId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: faculty } = await supabase
                .from('faculty_fs')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            const { data, error } = await supabase
                .rpc('get_faculty_required_docs_fs', {
                    p_course_id: courseId,
                    p_faculty_id: faculty.faculty_id
                });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching required docs:', error);
            throw error;
        }
    },

    /**
     * Get list of courses for dropdown
     */
    async getFacultyCourses() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Get faculty_id from user_id
            const { data: faculty, error: facultyError } = await supabase
                .from('faculty_fs')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            if (facultyError) throw facultyError;

            // Get current semester and academic year from system settings
            const { data: settings } = await supabase
                .from('systemsettings_fs')
                .select('setting_key, setting_value')
                .in('setting_key', ['current_semester', 'current_academic_year']);

            const semester = settings?.find(s => s.setting_key === 'current_semester')?.setting_value;
            const academicYear = settings?.find(s => s.setting_key === 'current_academic_year')?.setting_value;

            const { data, error } = await supabase
                .from('courses_fs')
                .select('course_id, course_code, course_name')
                .eq('faculty_id', faculty.faculty_id)
                .eq('semester', semester)
                .eq('academic_year', academicYear);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching courses:', error);
            throw error;
        }
    },

    /**
     * Upload submission file and create database record
     */
    async uploadSubmission({ file, courseId, docTypeId, semester, academicYear }) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // 1. Get faculty ID
            const { data: faculty } = await supabase
                .from('faculty_fs')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            if (!faculty) throw new Error('Faculty profile not found');

            // 2. Upload to Google Drive via server.js
            const folderLink = await getFolderLink();
            const folderId = getFolderId(folderLink);
            if (!folderId) throw new Error('Google Drive folder not configured. Please set it in Admin Settings.');

            const gdriveFile = await uploadToGDrive(file, folderId);

            // 3. Insert/Update into Submissions table with Versioning via RPC
            const { data, error: insertError } = await supabase
                .rpc('upsert_submission_with_versioning_fs', {
                    p_faculty_id: faculty.faculty_id,
                    p_course_id: courseId,
                    p_doc_type_id: docTypeId,
                    p_original_filename: file.name,
                    p_standardized_filename: gdriveFile.name,
                    p_file_size_bytes: file.size,
                    p_mime_type: file.type,
                    p_gdrive_file_id: gdriveFile.id,
                    p_gdrive_web_view_link: gdriveFile.webViewLink,
                    p_gdrive_download_link: gdriveFile.webContentLink || gdriveFile.webViewLink,
                    p_semester: semester,
                    p_academic_year: academicYear
                });

            if (insertError) throw insertError;
            return data;

        } catch (error) {
            console.error('Error uploading submission:', error);
            throw error;
        }
    },

    /**
     * Run OCR on a file (Client-side)
     */
    async runOCR(file) {
        try {
            const result = await Tesseract.recognize(file, 'eng');
            return {
                text: result.data.text,
                confidence: result.data.confidence,
                success: true
            };
        } catch (err) {
            console.error("OCR Failed:", err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Get Submission History for Faculty
     */
    async getSubmissionHistory() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // 1. Get faculty ID
            const { data: faculty } = await supabase
                .from('faculty_fs')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            if (!faculty) throw new Error('Faculty profile not found');

            // 2. Fetch submissions
            const { data, error } = await supabase
                .from('submissions_fs')
                .select(`
                    submission_id,
                    submitted_at,
                    submission_status,
                    original_filename,
                    courses_fs (course_code, course_name),
                    documenttypes_fs (type_name, doc_type_id),
                    course_id,
                    doc_type_id
                `)
                .eq('faculty_id', faculty.faculty_id)
                .order('submitted_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching submission history:', error);
            throw error;
        }
    }
};
