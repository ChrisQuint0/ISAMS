import { supabase } from "@/lib/supabaseClient";
import Tesseract from 'tesseract.js';
import { getFolderLink, getFolderId, uploadToGDrive } from './gdriveSettings';

export const FacultySubmissionService = {
    /**
     * Get required documents for a specific course
     */
    async getRequiredDocs(courseId) {
        try {
            const { data, error } = await supabase
                .rpc('get_faculty_required_docs_fs', {
                    p_course_id: courseId
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
                .select(`
                    course_id, 
                    course_code, 
                    course_name, 
                    section,
                    master_courses_fs (is_active)
                `)
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

            // 1. Get faculty profile
            const { data: faculty } = await supabase
                .from('faculty_fs')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (!faculty) throw new Error('Faculty profile not found');

            const facultyName = `${faculty.first_name || ''} ${faculty.last_name || ''}`.trim();

            // 2. Get course details (code + section) for folder naming
            const { data: course } = await supabase
                .from('courses_fs')
                .select('course_code, section')
                .eq('course_id', courseId)
                .single();

            // 3. Get document type name for the deepest folder
            const { data: docType } = await supabase
                .from('documenttypes_fs')
                .select('type_name, gdrive_folder_name')
                .eq('doc_type_id', docTypeId)
                .single();

            // Use gdrive_folder_name for technical path, fall back to type_name
            const technicalFolder = docType?.gdrive_folder_name || docType?.type_name || 'Other';
            const displayDocType = docType?.type_name || 'Document';

            // 4. Resolve the current AY and semester from system settings (use passed-in or fetch)
            let currentAY = academicYear;
            let currentSemester = semester;

            const { data: settings } = await supabase
                .from('systemsettings_fs')
                .select('setting_key, setting_value')
                .in('setting_key', ['current_semester', 'current_academic_year']);

            if (!currentSemester) currentSemester = settings?.find(s => s.setting_key === 'current_semester')?.setting_value;
            if (!currentAY) currentAY = settings?.find(s => s.setting_key === 'current_academic_year')?.setting_value;

            // 5. Upload to Google Drive — always use main folder hierarchy
            const folderLink = await getFolderLink();
            const rootFolderId = getFolderId(folderLink);
            if (!rootFolderId) throw new Error('Please Let the admin update the gdrive folder link on admin settings');

            // Root > AY > Semester > Faculty > Course-Section > DocType
            const { ensureFolderStructure } = await import('./gdriveSettings');
            const targetFolderId = await ensureFolderStructure(rootFolderId, {
                academicYear: currentAY,
                semester: currentSemester,
                facultyName,
                courseCode: course?.course_code,
                section: course?.section,
                docTypeName: technicalFolder,
            });

            // 5.b Standardize Filename: {CourseCode}_{LastName}_{FirstName}_{DocType}.{extension}
            const cleanLastName = (faculty.last_name || '').replace(/\s+/g, '_');
            const cleanFirstName = (faculty.first_name || '').replace(/\s+/g, '_');
            const cleanDocType = displayDocType.replace(/\s+/g, '_');
            const cleanOriginal = file.name.substring(0, file.name.lastIndexOf('.')).replace(/[^a-zA-Z0-9]/g, '_');
            const extension = file.name.substring(file.name.lastIndexOf('.'));
            const standardizedName = `${course?.course_code || 'COURSE'}_${cleanLastName}_${cleanFirstName}_${cleanDocType}_${cleanOriginal}${extension}`;

            console.log(`[FacultySubmissionService] Renaming file to: ${standardizedName}`);

            // Re-create the file object with the new name
            const renamedFile = new File([file], standardizedName, { type: file.type });

            // 5.c Upload the file
            const gdriveFile = await uploadToGDrive(renamedFile, targetFolderId);

            // 6. Insert/Update into Submissions table with Versioning via RPC
            const { data, error: insertError } = await supabase
                .rpc('upsert_submission_with_versioning_fs', {
                    p_faculty_id: faculty.faculty_id,
                    p_course_id: courseId,
                    p_doc_type_id: docTypeId,
                    p_original_filename: file.name,
                    p_standardized_filename: gdriveFile.name,
                    p_file_size_bytes: file.size,
                    p_mime_type: file.type,
                    p_file_checksum: null,
                    p_gdrive_file_id: gdriveFile.id,
                    p_gdrive_web_view_link: gdriveFile.webViewLink,
                    p_gdrive_download_link: gdriveFile.webContentLink || gdriveFile.webViewLink,
                    p_is_staged: false // Required to resolve overloaded function signature
                });

            if (insertError) throw insertError;

            // 7. Status Lifecycle Logic: If this requirement had a revision request, mark ALL related records as RESUBMITTED
            // We check if ANY file in this (faculty, course, docType) is in REVISION_REQUESTED state
            const { data: revisionRecords } = await supabase
                .from('submissions_fs')
                .select('submission_id')
                .eq('faculty_id', faculty.faculty_id)
                .eq('course_id', courseId)
                .eq('doc_type_id', docTypeId)
                .eq('submission_status', 'REVISION_REQUESTED');

            if (revisionRecords && revisionRecords.length > 0) {
                // Update ALL records for this requirement in one go
                // This ensures the dashboard and admin sidebar stay in sync
                await supabase
                    .from('submissions_fs')
                    .update({ 
                        submission_status: 'SUBMITTED',
                        approval_remarks: 'File re-submitted by faculty after revision request.'
                    })
                    .eq('faculty_id', faculty.faculty_id)
                    .eq('course_id', courseId)
                    .eq('doc_type_id', docTypeId);
                
                console.log(`[Service] Synced ${revisionRecords.length} records to RESUBMITTED for requirement.`);
            }

            return data;

        } catch (error) {
            console.error('Error uploading submission:', error);
            throw error;
        }
    },

    /**
     * Run OCR on a file (Client-side Image vs Edge Function Doc)
     * Validates against the Document Type's Keyword Dictionaries
     */
    async runOCR(file, docTypeId, extension) {
        try {
            // First, get the validation rules for this document type
            const { data: docType, error: docError } = await supabase
                .from('documenttypes_fs')
                .select('required_keywords, forbidden_keywords')
                .eq('doc_type_id', docTypeId)
                .limit(1)
                .maybeSingle();

            if (docError) {
                console.error("Error fetching docType rules:", docError);
            }

            if (!docType) {
                console.warn(`Validation rules not found for document type ID: ${docTypeId}. Bypassing keyword check.`);
            }

            let extractedText = "";

            // PATH 1: LOCAL EXPRESS ROUTE / TESSERACT CLIENT (IMAGES)
            if (['.png', '.jpg', '.jpeg'].includes(extension)) {
                console.log("[OCR Bot] Sending Image to Tesseract");
                const result = await Tesseract.recognize(file, 'eng');
                extractedText = result.data.text;

                // Perform Manual Validation on extracted text if rules exist
                const normalizedExtractedText = extractedText.toLowerCase();
                const noSpaceText = normalizedExtractedText.replace(/\s+/g, '');

                if (docType?.required_keywords?.length > 0) {
                    const missing = docType.required_keywords.filter(kw => {
                        const kwLower = kw.toLowerCase();
                        const kwNoSpace = kwLower.replace(/\s+/g, '');
                        return !normalizedExtractedText.includes(kwLower) && !noSpaceText.includes(kwNoSpace);
                    });
                    if (missing.length > 0) return { success: false, text: `Validation Failed. Missing required keywords: ${missing.join(', ')}`, confidence: result.data.confidence };
                }

                if (docType?.forbidden_keywords?.length > 0) {
                    const found = docType.forbidden_keywords.filter(kw => {
                        const kwLower = kw.toLowerCase();
                        const kwNoSpace = kwLower.replace(/\s+/g, '');
                        return normalizedExtractedText.includes(kwLower) || noSpaceText.includes(kwNoSpace);
                    });
                    if (found.length > 0) return { success: false, text: `Validation Failed. Contains forbidden keywords: ${found.join(', ')}`, confidence: result.data.confidence };
                }

                return {
                    text: extractedText,
                    confidence: result.data.confidence,
                    success: true
                };
            }

            // PATH 2: SUPABASE EDGE FUNCTION (PDFs, DOCX, CSV, ETC)
            else {
                console.log("[OCR Bot] Sending Text Document to Supabase Edge Function: document-parser");

                // We send the file to the Edge Function via FormData
                const formData = new FormData();
                formData.append('files', file);
                formData.append('doc_type_id', String(docTypeId));

                const { data, error } = await supabase.functions.invoke('document-parser', {
                    body: formData,
                });

                if (error) {
                    console.error("Edge Function Error:", error);
                    return { success: false, text: "Edge Function returned an error. Please try again.", confidence: 100 };
                }

                if (data?.error && data.pass === undefined) {
                    return { success: false, text: `Server Error: ${data.error}`, confidence: 100 };
                }

                // The Edge Function handles the keyword matching on its end and returns a 'pass' flag
                if (data && data.pass === false) {
                    let failMsg = data.error || "Document failed automated content checks.";
                    if (data.missingKeywords?.length > 0) failMsg = `Validation Failed. Missing required keywords: ${data.missingKeywords.join(', ')}`;
                    if (data.foundForbidden?.length > 0) failMsg = `Validation Failed. Contains forbidden keywords: ${data.foundForbidden.join(', ')}`;

                    return { success: false, text: failMsg, confidence: 100 };
                }

                return {
                    text: data?.extractedText || "Document parsed and validated successfully via Edge Function.",
                    confidence: 100, // Edge functions parsing raw text are 100% confident
                    success: true
                };
            }
        } catch (err) {
            console.error("OCR Failed:", err);
            return { success: false, error: err.message || "Validation engine offline." };
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
                    courses_fs (course_code, course_name, section),
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
    },

    /**
     * Clear Submission History for Faculty
     */
    async clearSubmissionHistory() {
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

            // 2. Delete submissions
            const { error } = await supabase
                .from('submissions_fs')
                .delete()
                .eq('faculty_id', faculty.faculty_id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error clearing submission history:', error);
            throw error;
        }
    }
};
