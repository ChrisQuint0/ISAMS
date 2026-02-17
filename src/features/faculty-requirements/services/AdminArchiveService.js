import { supabase } from '@/lib/supabaseClient';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const archiveService = {
  /**
   * Fetch filtered documents using the SQL function
   */
  getDocuments: async (filters) => {
    const { data, error } = await supabase.rpc('get_archived_documents_fn', {
      p_semester: filters.semester === 'All Semesters' ? null : filters.semester,
      p_academic_year: filters.academic_year === 'All Years' ? null : filters.academic_year,
      p_department: filters.department === 'All Departments' ? null : filters.department,
      p_doc_type: filters.doc_type === 'All Document Types' ? null : filters.doc_type,
      p_status: filters.status === 'All Status' ? null : filters.status,
      p_search_query: filters.search_query || null,
      p_limit: 100,
      p_offset: 0
    });

    if (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }

    // Format the size on the client side
    return data.map(doc => ({
      ...doc,
      formatted_size: formatBytes(doc.archive_size_bytes)
    }));
  },

  /**
   * Fetch statistics
   */
  getStatistics: async () => {
    const { data, error } = await supabase.rpc('get_archive_stats_fn');

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
    if (doc.view_link || doc.download_link) {
      window.open(doc.download_link || doc.view_link, '_blank');
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
    const [depts, types] = await Promise.all([
      supabase.from('faculty').select('department').neq('department', null),
      supabase.from('document_types').select('type_name')
    ]);

    const uniqueDepts = [...new Set(depts.data?.map(d => d.department))];
    const uniqueTypes = types.data?.map(t => t.type_name);

    return { departments: uniqueDepts, types: uniqueTypes };
  },

  /**
   * Bulk Download as ZIP
   */
  downloadArchiveZip: async (config, onProgress) => {
    try {
      // 1. Get Links
      const { data: files, error } = await supabase.rpc('get_archive_export_links_fn', {
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
      saveAs(content, `ISAMS_Archive_Export.zip`);

      return { success: true, message: `Successfully exported ${processed} files.` };

    } catch (err) {
      console.error("ZIP Export Failed:", err);
      return { success: false, message: err.message || "Export failed." };
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