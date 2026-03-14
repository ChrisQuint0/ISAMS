import { supabase } from "@/lib/supabaseClient";
import { getFolderLink, getFolderId, uploadToGDrive, ensureFolderStructure, deleteGDriveFile } from './gdriveSettings';

export const facultyMonitorService = {
  /**
   * Get Faculty Monitor List (with filters)
   */
  getMonitoringData: async (filters) => {
    const { data, error } = await supabase.rpc('get_faculty_monitoring_fs', {
      p_semester: filters.semester === 'All Semesters' ? null : filters.semester,
      p_academic_year: filters.academic_year === 'All Years' ? null : filters.academic_year,
      p_course_code: filters.course === 'All Courses' ? null : filters.course,
      p_section: filters.section === 'All Sections' ? null : filters.section,
      p_status: filters.status === 'All Status' ? null : filters.status,
      p_search: filters.search || null
    });

    if (error) throw error;

    // Remap the SQL result to match what the UI expects (courses_json -> courses)
    return data.map(f => ({
      ...f,
      courses: f.courses_json || [] // Flatten the JSONB column
    }));
  },

  /**
   * Get dynamic courses and their submission status for a specific faculty
   */
  getFacultyCourseStatus: async (facultyId) => {
    const { data, error } = await supabase.rpc('get_faculty_courses_status_fs', {
      p_faculty_id: facultyId
    });

    if (error) throw error;
    return data; // returns jsonb array
  },

  /**
   * Helper options
   */
  getOptions: async () => {
    // 1. Get current semester/year settings for filtering
    const { data: settings } = await supabase
      .from('systemsettings_fs')
      .select('setting_key, setting_value')
      .in('setting_key', ['current_semester', 'current_academic_year']);

    const currentSem = settings?.find(s => s.setting_key === 'current_semester')?.setting_value;
    const currentYear = settings?.find(s => s.setting_key === 'current_academic_year')?.setting_value;

    // Fallbacks if settings missing
    const fallbackSem = (EXTRACT_MONTH) => {
      const month = new Date().getMonth() + 1;
      if (month >= 1 && month <= 5) return '2nd Semester';
      if (month >= 6 && month <= 7) return 'Summer';
      return '1st Semester';
    };
    const fallbackYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

    const sem = currentSem || fallbackSem();
    const year = currentYear || fallbackYear;

    // 2. Fetch unique sections and courses for the CURRENT semester/year
    const [sections, courses] = await Promise.all([
      supabase.from('courses_fs')
        .select('section')
        .eq('semester', sem)
        .eq('academic_year', year)
        .neq('section', null),
      supabase.from('courses_fs')
        .select('course_code')
        .eq('semester', sem)
        .eq('academic_year', year)
    ]);

    // Unique values
    return {
      sections: [...new Set(sections.data?.map(s => s.section))].sort(),
      courses: [...new Set(courses.data?.map(c => c.course_code))].sort()
    };
  },

  /**
   * Send Single Reminder
   */
  sendReminder: async (facultyId) => {
    // 1. Trigger Email via Edge Function / Express Backend
    // The backend now checks the email_reminders_enabled flag.
    const emailResult = await adminFacultyMonitoringService.sendEmail({
      facultyId,
      template: 'deadline_reminder',
      subject: 'Urgent: Submission Reminder'
    });

    // 2. Only log notification in DB if email was actually sent or wasn't ignored
    if (emailResult && !emailResult.ignored) {
      const { error } = await supabase.from('notifications_fs').insert({
        faculty_id: facultyId,
        notification_type: 'DEADLINE_REMINDER',
        subject: 'Urgent: Submission Reminder',
        message: 'This is a manual reminder to complete your faculty requirements.'
      });
      if (error) throw error;
    }

    return emailResult;
  },

  /**
   * Send Bulk Reminders (UI-Synced)
   */
  sendBulkReminders: async (filteredFacultyList, subject = 'Urgent Reminder', message = 'Please check your pending submissions.') => {
    if (!filteredFacultyList || filteredFacultyList.length === 0) {
      throw new Error("No faculty members match the current filters.");
    }

    // Process individually to respect per-faculty email preferences
    const results = await adminFacultyMonitoringService.sendBulkEmails(filteredFacultyList, {
      subject,
      message,
      template: 'deadline_reminder'
    });

    return { 
      total_sent: results.succeeded, 
      total_ignored: results.ignored || 0,
      message: `Processed ${filteredFacultyList.length} reminders. ${results.succeeded} sent, ${results.ignored || 0} skipped.` 
    };
  },

  /**
   * Export Data to CSV
   */
  exportToCSV: (data, filename = 'faculty_monitoring_report.csv') => {
    if (!data || !data.length) return;

    const headers = ["EMP ID", "Name", "Status", "Overall Progress", "Submitted", "Pending", "Late", "Assigned Courses"];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '';
      const stringValue = String(str);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const rows = data.map(f => [
      escapeCsv(f.emp_id || f.faculty_id),
      escapeCsv(`${f.first_name} ${f.last_name}`),
      escapeCsv(f.status),
      `${f.overall_progress}%`,
      f.submitted_submissions,
      f.pending_submissions,
      f.late_submissions,
      escapeCsv(f.courses ? f.courses.map(c => c.course_code).join('; ') : 'N/A')
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Admin Force Upload Submission
   * Bypasses OCR/Validation and uploads on behalf of faculty
   */
  adminUploadSubmission: async ({ file, facultyId, courseId, docTypeId }) => {
    try {
      // 1. Get faculty profile
      const { data: faculty } = await supabase
        .from('faculty_fs')
        .select('*')
        .eq('faculty_id', facultyId)
        .single();
      if (!faculty) throw new Error('Faculty profile not found');

      const facultyName = `${faculty.first_name || ''} ${faculty.last_name || ''}`.trim();

      // 2. Get course details
      const { data: course } = await supabase
        .from('courses_fs')
        .select('course_code, section, semester, academic_year')
        .eq('course_id', courseId)
        .single();

      // 3. Get document type name
      const { data: docType } = await supabase
        .from('documenttypes_fs')
        .select('type_name, gdrive_folder_name')
        .eq('doc_type_id', docTypeId)
        .single();

      const technicalFolder = docType?.gdrive_folder_name || docType?.type_name || 'Other';
      const displayDocType = docType?.type_name || 'Document';

      // 4. Resolve GDrive Folder
      const folderLink = await getFolderLink();
      const rootFolderId = getFolderId(folderLink);
      if (!rootFolderId) throw new Error('GDrive root folder not configured in Admin Settings.');

      const targetFolderId = await ensureFolderStructure(rootFolderId, {
        academicYear: course?.academic_year,
        semester: course?.semester,
        facultyName,
        courseCode: course?.course_code,
        section: course?.section,
        docTypeName: technicalFolder,
      });

      // 5. Standardize Filename
      const cleanLastName = (faculty.last_name || '').replace(/\s+/g, '_');
      const cleanFirstName = (faculty.first_name || '').replace(/\s+/g, '_');
      const cleanDocType = displayDocType.replace(/\s+/g, '_');
      const cleanOriginal = file.name.substring(0, file.name.lastIndexOf('.')).replace(/[^a-zA-Z0-9]/g, '_');
      const extension = file.name.substring(file.name.lastIndexOf('.'));
      const standardizedName = `${course?.course_code || 'COURSE'}_${cleanLastName}_${cleanFirstName}_${cleanDocType}_${cleanOriginal}${extension}`;

      const renamedFile = new File([file], standardizedName, { type: file.type });

      // 6. Upload
      const gdriveFile = await uploadToGDrive(renamedFile, targetFolderId);

      // 7. Database Update (RPC)
      const { data, error: rpcError } = await supabase.rpc('upsert_submission_with_versioning_fs', {
        p_faculty_id: facultyId,
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
        p_is_staged: false
      });

      if (rpcError) throw rpcError;

      return data;
    } catch (error) {
      console.error('Error in adminUploadSubmission:', error);
      throw error;
    }
  },


  /**
   * Request a revision for a submitted document
   * Updates the submission status and creates a notification
   */
  requestRevision: async ({ submissionId, submissionIds, gdriveFileIds, shouldDelete, facultyId, reason, courseDetails, docType, filenames, manualUploads = [], courseId, docTypeId }) => {
    // Standardize IDs into an array
    const ids = submissionIds || (submissionId ? [submissionId] : []);
    const gIds = gdriveFileIds || [];

    // 0. Consolidate target revision records
    // We only want ONE record per (faculty, course, docType) to avoid UI confusion
    const finalIdsToUpdate = [...ids];

    if (manualUploads.length > 0 && courseId && docTypeId) {
      // Check if any of these already have a record in the DB
      // Note: In ISAMS, we try to keep a one-record-per-requirement model for primary status tracking
      const { data: existingRecords } = await supabase
        .from('submissions_fs')
        .select('submission_id, gdrive_file_id')
        .eq('faculty_id', facultyId)
        .eq('course_id', courseId)
        .eq('doc_type_id', docTypeId);

      const existingGdriveIds = new Set(existingRecords?.map(r => r.gdrive_file_id) || []);
      const existingSubId = existingRecords?.[0]?.submission_id;

      const toInsert = [];
      const toUpdateImmediately = [];

      for (const m of manualUploads) {
        if (existingGdriveIds.has(m.gdrive_file_id)) {
          // This specific file is already tracked, just update its status via the 'ids' array later
          const matchedSub = existingRecords.find(r => r.gdrive_file_id === m.gdrive_file_id);
          if (matchedSub) finalIdsToUpdate.push(matchedSub.submission_id);
        } else {
          // No record for this specific GDrive ID? Create one.
          // Note: In ISAMS, a requirement (course+docType) can have multiple submissions (files).
          toInsert.push({
            faculty_id: facultyId,
            course_id: courseId,
            doc_type_id: docTypeId,
            gdrive_file_id: m.gdrive_file_id,
            original_filename: m.original_filename,
            standardized_filename: m.standardized_filename || m.original_filename,
            submission_status: 'REVISION_REQUESTED',
            approval_remarks: reason,
            submitted_at: new Date().toISOString()
          });
        }
      }

      if (toInsert.length > 0) {
        const { data: created, error: iErr } = await supabase
          .from('submissions_fs')
          .insert(toInsert)
          .select();
        if (iErr) console.error("[Service] Insert failed:", iErr);
        if (created) created.forEach(c => finalIdsToUpdate.push(c.submission_id));
      }
    }

    // 1. Move files to GDrive Trash (Soft Delete) if requested
    if (shouldDelete && gIds.length > 0) {
      await Promise.all(gIds.map(gid => deleteGDriveFile(gid)));
    }

    // 2. Update all identified records to REVISION_REQUESTED
    const uniqueIds = [...new Set(finalIdsToUpdate)];
    if (uniqueIds.length > 0) {
      const { error: updateError } = await supabase
        .from('submissions_fs')
        .update({
          submission_status: 'REVISION_REQUESTED',
          approval_remarks: reason
        })
        .in('submission_id', uniqueIds);

      if (updateError) throw updateError;
    }

    // 3. Notify the faculty
    const { error: notifError } = await supabase.from('notifications_fs').insert({
      faculty_id: facultyId,
      notification_type: 'REVISION_REQUEST',
      subject: 'Document Revision Required',
      message: reason || 'Please review and resubmit your document — the admin has requested a revision.'
    });

    if (notifError) throw notifError;

    // Fire a real email — non-blocking (don't fail if email fails)
    try {
      await adminFacultyMonitoringService.sendEmail({
        facultyId,
        template: 'revision_request',
        message: reason,
        courseDetails,
        docType,
        filenames
      });
    } catch (emailErr) {
      console.warn('Email send failed (non-critical):', emailErr.message);
    }

    return true;
  },

  /**
   * Send a real email via the local Express server (SendGrid)
   */
  sendEmail: async ({ facultyId, template = 'deadline_reminder', subject, message, pendingCount, lateCount, courseDetails, docType, filenames }) => {
    const res = await fetch('http://localhost:3002/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        faculty_id: facultyId,
        template,
        subject,
        message,
        pending_count: pendingCount,
        late_count: lateCount,
        courseDetails,
        docType,
        filenames
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Email send failed');
    return data; // { success: true, ignored: true/false, ... }
  },

  /**
   * Send bulk reminder emails to a list of faculty
   */
  sendBulkEmails: async (facultyList, { subject, message, template = 'deadline_reminder' } = {}) => {
    const results = await Promise.allSettled(
      facultyList.map(f =>
        adminFacultyMonitoringService.sendEmail({
          facultyId: f.faculty_id || f.id,
          template,
          subject,
          message,
          pendingCount: f.pending_submissions,
          lateCount: f.late_submissions
        })
      )
    );

    const succeeded = results.filter(r => r.status === 'fulfilled' && !r.value.ignored).length;
    const failed = results.filter(r => r.status === 'rejected').length;
    const ignored = results.filter(r => r.status === 'fulfilled' && r.value.ignored).length;
    
    return { succeeded, failed, ignored, total: facultyList.length };
  }
};

// Self-reference so internal methods (requestRevision) can call sendEmail
const adminFacultyMonitoringService = facultyMonitorService;