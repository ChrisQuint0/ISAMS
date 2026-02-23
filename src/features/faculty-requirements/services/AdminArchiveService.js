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
      p_department: filters.department === 'All Departments' ? 'ALL' : filters.department,
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
   * Fetch statistics
   */
  getStatistics: async () => {
    const { data, error } = await supabase.rpc('get_archive_stats_fs');

    if (error) throw error;

    const MAX_STORAGE = 15 * 1024 * 1024 * 1024; // 15GB Google Drive standard quota
    const usedBytes = data.storage_used_bytes || 0;

    return {
      ...data,
      storage_total_bytes: MAX_STORAGE,
      storage_percentage: (usedBytes / MAX_STORAGE) * 100,
      average_document_size: data.total_documents > 0 ? usedBytes / data.total_documents : 0
    };
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
    const [depts, types, courses] = await Promise.all([
      supabase.from('faculty_fs').select('department').neq('department', null),
      supabase.from('documenttypes_fs').select('type_name'),
      supabase.from('courses_fs').select('semester, academic_year')
    ]);

    const uniqueDepts = [...new Set(depts.data?.map(d => d.department))];
    const uniqueTypes = types.data?.map(t => t.type_name);
    const uniqueSemesters = [...new Set(courses.data?.map(c => c.semester))].filter(Boolean);
    const uniqueYears = [...new Set(courses.data?.map(c => c.academic_year))].filter(Boolean);

    return {
      departments: uniqueDepts,
      types: uniqueTypes,
      semesters: uniqueSemesters.length ? uniqueSemesters : [],
      years: uniqueYears.length ? uniqueYears : []
    };
  },

  /**
   * Bulk Download as ZIP
   */
  downloadArchiveZip: async (config, onProgress) => {
    try {
      // 1. Get Links
      const { data: files, error } = await supabase.rpc('get_archive_export_links_fs', {
        p_semester: config.semester === 'All Semesters' ? null : config.semester,
        p_department: config.department === 'All Departments' ? null : config.department
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
      const filename = `ISAMS_Archive_${config.semester || 'All'}_${config.department || 'All'}.zip`;
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
      const { data, error } = await supabase.rpc('get_report_history_fs', { p_limit: 5 });
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
  logExport: async (reportName, semester, year) => {
    try {
      const { error } = await supabase.rpc('log_report_export_fs', {
        p_report_name: reportName,
        p_report_type: 'ZIP_ARCHIVE_EXPORT',
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