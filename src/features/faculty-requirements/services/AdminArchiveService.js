import { supabase } from '@/lib/supabaseClient';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const archiveService = {
  /**
   * Fetch filtered documents using the SQL function
   */
  getDocuments: async (filters, page = 1, pageSize = 100) => {
    const { data, error } = await supabase.rpc('get_archived_documents_fs', {
      // FIX: Send 'ALL' instead of null so the database knows not to use defaults
      p_semester: filters.semester === 'All Semesters' ? 'ALL' : filters.semester,
      p_academic_year: filters.academic_year === 'All Years' ? 'ALL' : filters.academic_year,
      p_department: 'ALL', // Hardcoded since system is single-department
      p_doc_type: filters.doc_type === 'All Document Types' ? 'ALL' : filters.doc_type,
      p_status: filters.status === 'All Status' ? 'ALL' : filters.status,
      p_search_query: filters.search_query || null,
      // FIX: Pass actual pagination variables
      p_limit: pageSize,
      p_offset: (page - 1) * pageSize
    });

    if (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }

    return data.map(doc => ({
      ...doc,
      formatted_size: formatBytes(doc.archive_size_bytes)
    }));
  },


  /**
   * Handle File Download / View
   * Since we are Direct-to-Drive, we use the Google Links directly.
   */
  downloadFile: async (doc) => {
    // If we have a direct web view link from Google, use it
    if (doc.gdrive_web_view_link || doc.gdrive_download_link) {
      window.open(doc.gdrive_download_link || doc.gdrive_web_view_link, '_blank');
      return { success: true, message: 'Opening Google Drive...' };
    }

    // Fallback: Construct link using ID
    if (doc.gdrive_file_id) {
      const url = `https://drive.google.com/uc?export=download&id=${doc.gdrive_file_id}`;
      window.open(url, '_blank');
      return { success: true, message: 'Opening download link...' };
    }

    return { success: false, message: 'File link not found.' };
  },

  /**
   * Helper to fetch dropdown options
   */
  getOptions: async () => {
    const [types, courses, faculty, semesterPeriods, systemSettings] = await Promise.all([
      supabase.from('documenttypes_fs').select('type_name'),
      supabase.from('courses_fs').select('semester, academic_year, course_code, section, faculty_id'),
      supabase.from('faculty_fs').select('faculty_id, first_name, last_name').neq('role', 'ADMIN'),
      // Fetch all historical + active periods from semester management
      supabase.from('semester_history_fs').select('academic_year, semester, status').order('created_at', { ascending: false }),
      // Fetch the current active semester from system settings
      supabase.from('systemsettings_fs').select('setting_key, setting_value').in('setting_key', ['current_semester', 'current_academic_year'])
    ]);

    const uniqueTypes = types.data?.map(t => t.type_name) || [];
    
    // We will now return the full raw courses array so the frontend can filter by faculty_id
    const rawCourses = courses.data || [];
    
    // Default unique lists for when "All Faculty" is selected
    const uniqueCourses = [...new Set(rawCourses.map(c => c.course_code))].filter(Boolean);
    const uniqueSections = [...new Set(rawCourses.map(c => c.section))].filter(Boolean);
    
    // Sort faculties by last name
    const facultiesList = (faculty.data || []).map(f => ({
      id: f.faculty_id,
      name: `${f.first_name} ${f.last_name}`
    })).sort((a,b) => a.name.localeCompare(b.name));

    // Build current semester object from system settings
    const settingsMap = {};
    (systemSettings.data || []).forEach(s => { settingsMap[s.setting_key] = s.setting_value; });
    const currentSemester = settingsMap['current_semester'];
    const currentAcademicYear = settingsMap['current_academic_year'];

    // Build semester periods: combine semester_history (past) + current active from systemsettings
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

    // Unique semesters and years from all periods
    const uniqueSemesters = [...new Set(historicalPeriods.map(p => p.semester))].filter(Boolean);
    const uniqueYears = [...new Set(historicalPeriods.map(p => p.academic_year))].filter(Boolean);

    return {
      types: uniqueTypes,
      semesters: uniqueSemesters,
      years: uniqueYears,
      semesterPeriods: historicalPeriods, // for rich dropdowns with status labels
      currentSemester,
      currentAcademicYear,
      courses: uniqueCourses,
      sections: uniqueSections,
      rawCourses: rawCourses,
      faculties: facultiesList
    };
  },

  /**
   * Bulk Download as ZIP
   */
  downloadArchiveZip: async (config, onProgress) => {
    try {
      // 1. Get Links with all config filters
      const { data: files, error } = await supabase.rpc('get_archive_export_links_fs', {
        p_semester: config.semester === 'All Semesters' ? 'ALL' : config.semester,
        p_academic_year: config.academic_year === 'All Years' ? 'ALL' : config.academic_year,
        p_faculty_id: config.faculty === 'All Faculty' ? 'ALL' : config.faculty,
        p_course_code: config.course === 'All Courses' ? 'ALL' : config.course,
        p_section: config.section === 'All Sections' ? 'ALL' : config.section,
        p_doc_type: config.doc_type === 'All Document Types' ? 'ALL' : config.doc_type
      });

      if (error) throw error;
      // 2. Prepare payload for Node backend to bypass CORS
      const payloadFiles = files.map(file => {
        // SQL function gives us original_filename, document_type, course_code, section, faculty_name, gdrive_download_link
        const docType = file.document_type || 'Uncategorized';
        const filename = file.original_filename || 'Unknown_File';
        const facultyFolder = file.faculty_name ? file.faculty_name.replace(/[\/\\:*?"<>|]/g, '').trim() : 'Unknown_Faculty';
        const courseFolder = `${file.course_code || 'Course'} - ${file.section || 'Sec'}`.replace(/[\/\\:*?"<>|]/g, '').trim();
        
        // Extract ID for the backend
        const fileIdMatch = file.gdrive_download_link?.match(/id=([^&]+)/) || file.gdrive_download_link?.match(/\/d\/([a-zA-Z0-9-_]+)/);

        return {
          folder: `${facultyFolder}/${courseFolder}/${docType}`,
          filename: filename,
          fileId: fileIdMatch ? fileIdMatch[1] : null,
          fallbackLink: file.gdrive_download_link
        };
      });

      if (payloadFiles.length === 0) {
        return { success: false, message: 'No downloadable files found.' };
      }

      // 3. Request ZIP from Node Backend
      const response = await fetch('http://localhost:3002/api/faculty/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: 'Admin_Bulk', files: payloadFiles })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Export failed on server. Ensure the Node backend (port 3002) is running.');
      }

      const content = await response.blob();
      
      const safeSem = config.semester === 'All Semesters' ? 'AllSem' : config.semester;
      const safeAY = config.academic_year === 'All Years' ? 'AllAY' : config.academic_year;
      const safeProf = config.faculty === 'All Faculty' ? 'AllProf' : 'SpecProf';
      const safeCourse = config.course === 'All Courses' ? 'AllCourse' : config.course;
      const safeSec = config.section === 'All Sections' ? 'AllSec' : config.section;
      const safeDoc = config.doc_type === 'All Document Types' ? 'AllDocs' : config.doc_type;

      const filename = `AdminArchive_${safeAY}_${safeSem}_${safeProf}_${safeCourse}_${safeSec}_${safeDoc}_${new Date().toISOString().slice(0, 10)}.zip`
        .replace(/[^a-zA-Z0-9_.-]/g, '_'); // sanitize just in case
      
      saveAs(content, filename);

      // Log to database asynchronously (don't block the user return)
      archiveService.logExport(filename, config.semester, config.academic_year);

      return { success: true, message: `Successfully exported archive.` };

    } catch (err) {
      console.error("ZIP Export Failed:", err);
      return { success: false, message: err.message || "Export failed. Please ensure the backend server is running." };
    }
  },

  /**
   * Fetch Recent Downloads (Export History)
   */
  getDownloadHistory: async () => {
    try {
      const { data, error } = await supabase.rpc('get_report_history_fs', { p_limit: 5, p_report_type: 'ARCHIVES' });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching download history:', err);
      return [];
    }
  },

  /**
   * Log a new Export Action
   */
  logExport: async (reportName, semester, year, type = 'ZIP_ARCHIVE_EXPORT') => {
    try {
      const { error } = await supabase.rpc('log_report_export_fs', {
        p_report_name: reportName,
        p_report_type: type,
        p_semester: semester || 'All',
        p_academic_year: year || 'All'
      });
      if (error) console.error('Failed to log export:', error);
    } catch (err) {
      console.error('Failed to log export:', err);
    }
  }
};

// Utility to format bytes
function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}