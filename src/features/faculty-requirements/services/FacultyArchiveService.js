import { supabase } from '@/lib/supabaseClient';
import { saveAs } from 'file-saver';

export const FacultyArchiveService = {
  /**
   * Helper to fetch dropdown options dynamically based on the current faculty's courses
   */
  getOptions: async () => {
    try {
      const [semesterPeriods, systemSettings] = await Promise.all([
        // All historical + active semesters from semester management
        supabase.from('semester_history_fs').select('academic_year, semester, status').order('created_at', { ascending: false }),
        // Current active semester from system settings
        supabase.from('systemsettings_fs').select('setting_key, setting_value').in('setting_key', ['current_semester', 'current_academic_year'])
      ]);

      // Build current active semester from system settings
      const settingsMap = {};
      (systemSettings.data || []).forEach(s => { settingsMap[s.setting_key] = s.setting_value; });
      const currentSemester = settingsMap['current_semester'];
      const currentAcademicYear = settingsMap['current_academic_year'];

      // Build semester periods array with status labels
      const historicalPeriods = (semesterPeriods.data || []).map(p => ({
        academic_year: p.academic_year,
        semester: p.semester,
        status: p.status === 'COMPLETED' ? 'Completed' : 'Active'
      }));

      // If current active semester isn't already in history, add it at the top
      const isCurrentInHistory = historicalPeriods.some(
        p => p.academic_year === currentAcademicYear && p.semester === currentSemester
      );
      if (currentSemester && currentAcademicYear && !isCurrentInHistory) {
        historicalPeriods.unshift({
          academic_year: currentAcademicYear,
          semester: currentSemester,
          status: 'Active'
        });
      }

      const uniqueSemesters = [...new Set(historicalPeriods.map(p => p.semester))].filter(Boolean);
      const uniqueYears = [...new Set(historicalPeriods.map(p => p.academic_year))].filter(Boolean);

      return {
        semesters: uniqueSemesters,
        academic_years: uniqueYears,
        semesterPeriods: historicalPeriods,
        currentSemester,
        currentAcademicYear
      };
    } catch (error) {
      console.error('Error fetching options:', error);
      return { semesters: [], academic_years: [], semesterPeriods: [], currentSemester: null, currentAcademicYear: null };
    }
  },


  /**
   * Fetch courses for the faculty based on semester/year filters
   */
  getArchivedCourses: async (semester, academicYear) => {
    try {
      const { data, error } = await supabase.rpc('get_faculty_archived_courses_fs', {
        p_semester: semester || 'ALL',
        p_academic_year: academicYear || 'ALL'
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching archived courses:', error);
      throw error;
    }
  },

  /**
   * Fetch submission history for a specific course
   */
  getCourseHistory: async (courseId) => {
    try {
      // We need the faculty_id to call this properly as required by the RPC
      const { data: facultyRecord, error: fError } = await supabase
        .from('faculty_fs')
        .select('faculty_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
        
      if (fError) throw fError;

      const { data, error } = await supabase.rpc('get_course_submissions_archive_fs', {
        p_faculty_id: facultyRecord.faculty_id,
        p_course_id: courseId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching course history:', error);
      throw error;
    }
  },

  getSubmissionVersions: async (submissionId, filename = null) => {
    try {
      const { data, error } = await supabase.rpc('get_document_versions_fs', {
        p_submission_id: parseInt(submissionId),
        p_filename: filename
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching submission versions:', error);
      throw error;
    }
  },

  /**
   * Bulk Download as ZIP for a specific course routed through Node backend
   */
  downloadArchiveZip: async (course, semester, academicYear, onProgress) => {
    try {
      const history = await FacultyArchiveService.getCourseHistory(course.course_id);
      
      if (!history || history.length === 0) {
        return { success: false, message: 'No submissions found to export.' };
      }

      const filesToDownload = history.filter(h => h.gdrive_download_link || h.gdrive_web_view_link);

      if (filesToDownload.length === 0) {
        return { success: false, message: 'No downloadable files found.' };
      }

      // Map the files into a clear payload payload for the backend
      const payloadFiles = filesToDownload.map(file => {
          const docType = file.type_name || 'Uncategorized';
          let filename = file.original_filename || `document_${file.submission_id}`;

          // Extract just the ID from the Drive link
          const fileIdMatch = file.gdrive_download_link?.match(/id=([^&]+)/) || file.gdrive_web_view_link?.match(/\/d\/([a-zA-Z0-9-_]+)/);

          return {
              folder: docType,
              filename: filename,
              fileId: fileIdMatch ? fileIdMatch[1] : null,
              fallbackLink: file.gdrive_web_view_link
          };
      });

      // POST the payload to the Express Node server to bypass CORS
      const response = await fetch('http://localhost:3002/api/faculty/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: course.course_id, files: payloadFiles })
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Export failed on server');
      }

      // Receive the ZIP stream from the Express server and trigger browser download
      const blob = await response.blob();
      
      const sanitize = (str) => (str || 'Unknown').replace(/[\/\\:*?"<>|]/g, '').replace(/\s+/g, '_');
      const ayStr = sanitize(academicYear);
      const semStr = sanitize(semester);
      const codeStr = sanitize(course.course_code);
      const secStr = sanitize(course.section);
      const dateStr = new Date().toISOString().slice(0, 10);
      
      const folderName = `${ayStr}_${semStr}_${codeStr}_${secStr}_${dateStr}.zip`;
      saveAs(blob, folderName);

      return { success: true, message: `Successfully exported archive.` };
    } catch (err) {
      console.error("ZIP Export Failed:", err);
      return { success: false, message: err.message || "Export failed." };
    }
  },

  /**
   * Bulk Download as ZIP for multiple courses
   */
  downloadBulkArchiveZip: async (courseList, semester, academicYear) => {
    try {
      if (!courseList || courseList.length === 0) {
        return { success: false, message: 'No courses available to export.' };
      }

      let allPayloadFiles = [];

      for (const course of courseList) {
        const history = await FacultyArchiveService.getCourseHistory(course.course_id);
        const filesToDownload = history?.filter(h => h.gdrive_download_link || h.gdrive_web_view_link) || [];
        
        const sanitizeCode = (str) => (str || 'Unknown').replace(/[\/\\:*?"<>|]/g, '').trim();
        const courseFolder = `${sanitizeCode(course.course_code)} - ${sanitizeCode(course.section)}`;

        const coursePayloadFiles = filesToDownload.map(file => {
            const docType = file.type_name || 'Uncategorized';
            let filename = file.original_filename || `document_${file.submission_id}`;
            const fileIdMatch = file.gdrive_download_link?.match(/id=([^&]+)/) || file.gdrive_web_view_link?.match(/\/d\/([a-zA-Z0-9-_]+)/);

            return {
                folder: `${courseFolder}/${docType}`,
                filename: filename,
                fileId: fileIdMatch ? fileIdMatch[1] : null,
                fallbackLink: file.gdrive_web_view_link
            };
        });

        allPayloadFiles = [...allPayloadFiles, ...coursePayloadFiles];
      }

      if (allPayloadFiles.length === 0) {
        return { success: false, message: 'No downloadable files found across all courses.' };
      }

      // POST the payload to the Express Node server to bypass CORS
      const response = await fetch('http://localhost:3002/api/faculty/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: 'Bulk', files: allPayloadFiles })
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Export failed on server');
      }

      // Format filename: AY_SEM_DATE.zip
      const sanitizeFile = (str) => (str || 'Unknown').replace(/[\/\\:*?"<>|]/g, '').replace(/\s+/g, '_');
      const ayStr = sanitizeFile(academicYear);
      const semStr = sanitizeFile(semester);
      const dateStr = new Date().toISOString().slice(0, 10);
      
      const blob = await response.blob();
      const folderName = `${ayStr}_${semStr}_${dateStr}.zip`;
      saveAs(blob, folderName);

      return { success: true, message: `Successfully exported bulk archive.` };
    } catch (err) {
      console.error("Bulk ZIP Export Failed:", err);
      return { success: false, message: err.message || "Bulk export failed." };
    }
  }
};
