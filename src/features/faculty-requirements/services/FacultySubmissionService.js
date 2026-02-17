import { supabase } from "@/lib/supabaseClient";
import Tesseract from 'tesseract.js';

export const FacultySubmissionService = {
    /**
     * Get required documents for a specific course
     */
    async getRequiredDocs(courseId) {
        try {
            const { data, error } = await supabase
                .rpc('get_faculty_required_docs', { p_course_id: courseId });

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
                .from('faculty')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            if (facultyError) throw facultyError;

            const { data, error } = await supabase
                .from('courses')
                .select('course_id, course_code, course_name')
                .eq('faculty_id', faculty.faculty_id);

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
                .from('faculty')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            if (!faculty) throw new Error('Faculty profile not found');

            // 2. Upload to Supabase Storage (or integrate GDrive here later)
            const fileExt = file.name.split('.').pop();
            const fileName = `${faculty.faculty_id}/${courseId}/${Date.now()}.${fileExt}`;
            const filePath = `submissions/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('faculty_documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 3. Insert into Submissions table
            const { data, error: insertError } = await supabase
                .from('submissions')
                .insert({
                    faculty_id: faculty.faculty_id,
                    course_id: courseId,
                    doc_type_id: docTypeId,
                    original_filename: file.name,
                    standardized_filename: fileName, // Simplified
                    file_size_bytes: file.size,
                    mime_type: file.type,
                    storage_provider: 'SUPABASE', // Defaulting to Supabase for now
                    supabase_file_path: filePath,
                    submission_status: 'SUBMITTED',
                    semester: semester || '2023-2', // Should be dynamic
                    academic_year: academicYear || '2023-2024',
                    submitted_at: new Date().toISOString()
                })
                .select()
                .single();

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
                .from('faculty')
                .select('faculty_id')
                .eq('user_id', user.id)
                .single();

            if (!faculty) throw new Error('Faculty profile not found');

            // 2. Fetch submissions
            const { data, error } = await supabase
                .from('submissions')
                .select(`
                    submission_id,
                    submitted_at,
                    submission_status,
                    original_filename,
                    courses (course_code, course_name),
                    document_types (type_name, doc_type_id),
                    course_id,
                    doc_type_id
                `)
                .eq('faculty_id', faculty.faculty_id)
                .order('submitted_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching submission history:', error);
            throw error;
        }
    }
};
