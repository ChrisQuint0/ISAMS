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
    const [types, courses, faculty] = await Promise.all([
      supabase.from('documenttypes_fs').select('type_name'),
      supabase.from('courses_fs').select('semester, academic_year, course_code, section, faculty_id'),
      supabase.from('faculty_fs').select('faculty_id, first_name, last_name').neq('role', 'ADMIN')
    ]);

    const uniqueTypes = types.data?.map(t => t.type_name) || [];
    const uniqueSemesters = [...new Set(courses.data?.map(c => c.semester))].filter(Boolean);
    const uniqueYears = [...new Set(courses.data?.map(c => c.academic_year))].filter(Boolean);
    
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

    return {
      types: uniqueTypes,
      semesters: uniqueSemesters.length ? uniqueSemesters : [],
      years: uniqueYears.length ? uniqueYears : [],
      courses: uniqueCourses,
      sections: uniqueSections,
      rawCourses: rawCourses, // <--- Send raw data to frontend for dynamic filtering
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
      if (!files || files.length === 0) return { success: false, message: 'No files found to export.' };

      const zip = new JSZip();
      const folder = zip.folder(`Archive_${new Date().toISOString().slice(0, 10)}`);

      let processed = 0;
      const total = files.length;

      // 2. Download each file
      // Note: This relies on the file URL being accessible via fetch (CORS).
      // If GDrive links block CORS, this step will fail.
      const downloadPromises = files.map(async (file) => {
        try {
          const response = await fetch(file.download_link);
          if (!response.ok) throw new Error('Network response was not ok');
          const blob = await response.blob();
          folder.file(file.filename, blob);
          processed++;
          if (onProgress) onProgress(Math.round((processed / total) * 100));
        } catch (err) {
          console.warn(`Failed to download ${file.filename}:`, err);
          folder.file(`${file.filename}.txt`, `Failed to download. Link: ${file.download_link}`);
        }
      });

      await Promise.all(downloadPromises);

      // 3. Generate ZIP
      const content = await zip.generateAsync({ type: "blob" });
      
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

      return { success: true, message: `Successfully exported ${processed} files.` };

    } catch (err) {
      console.error("ZIP Export Failed:", err);
      return { success: false, message: err.message || "Export failed." };
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