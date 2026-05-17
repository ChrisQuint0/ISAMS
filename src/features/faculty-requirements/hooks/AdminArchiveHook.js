import { useState, useEffect, useCallback } from 'react';
import { archiveService } from '../services/AdminArchiveService';

export function useAdminArchive() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [recentDownloads, setRecentDownloads] = useState([]);


  // Filters State
  const [filters, setFilters] = useState({
    semester: 'All Semesters',
    academic_year: 'All Years',
    doc_type: 'All Document Types',
    status: 'All Status',
    search_query: ''
  });

  // Options State
  const [options, setOptions] = useState({
    departments: [],
    types: [],
    semesters: [],
    years: [],
    courses: [],
    sections: [],
    rawCourses: [],
    faculties: []
  });

  // Derived Options for Bulk Export
  const [filteredOptions, setFilteredOptions] = useState({
    courses: [],
    sections: []
  });

  // Initialize
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const opts = await archiveService.getOptions();
        setOptions(prev => ({ ...prev, ...opts }));
        // Initially, filtered options match the full distinctive sets
        setFilteredOptions({
          courses: opts.courses,
          sections: opts.sections
        });
      } catch (err) {
        console.error("Failed to load options", err);
      }
    };
    loadOptions();
  }, []);

  // Fetch Data on Filter Change
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [docs, history] = await Promise.all([
        archiveService.getDocuments(filters),
        archiveService.getDownloadHistory()
      ]);
      setDocuments(docs);
      setRecentDownloads(history);
    } catch (err) {
      setError("Failed to load archive data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Debounce the fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Actions
  const handleDownload = async (doc) => {
    try {
      const result = await archiveService.downloadFile(doc);
      if (result.success) {
        setSuccess(result.message);
        // Log with the file's Drive ID so history re-downloads work
        await archiveService.logExport(
          doc.original_filename,
          doc.semester || 'All',
          doc.academic_year || 'All',
          'SINGLE_FILE_DOWNLOAD',
          {
            gdrive_file_id: doc.gdrive_file_id || null,
            gdrive_download_link: doc.gdrive_download_link || doc.gdrive_web_view_link || null,
            filename: doc.original_filename,
          }
        );
        fetchData();
      } else {
        setError(result.message);
      }

      setTimeout(() => {
        setSuccess(null);
        setError(null); 
      }, 3000);
    } catch (e) {
      setError("Download failed.");
      setTimeout(() => setError(null), 3000); 
    }
  };

  const reExportArchive = async (exportRecord) => {
    setLoading(true);
    setError(null);
    try {
      // Single file re-download: just open the Google Drive link
      if (exportRecord.report_type === 'SINGLE_FILE_DOWNLOAD') {
        const cfg = exportRecord.export_config;
        if (cfg?.gdrive_file_id) {
          const url = `https://drive.google.com/uc?export=download&id=${cfg.gdrive_file_id}`;
          window.open(url, '_blank');
          setSuccess('Opening file download...');
        } else if (cfg?.gdrive_download_link) {
          window.open(cfg.gdrive_download_link, '_blank');
          setSuccess('Opening file download...');
        } else {
          setError('Cannot re-download: file link was not saved for this history entry.');
        }
        setTimeout(() => { setSuccess(null); setError(null); }, 3000);
        return;
      }

      // ZIP archive re-export: use the full saved config
      const config = exportRecord.export_config
        ? exportRecord.export_config
        : {
            semester: exportRecord.semester || 'All Semesters',
            academic_year: exportRecord.academic_year || 'All Years',
            doc_type: 'All Document Types',
            faculty: 'All Faculty',
            course: 'All Courses',
            section: 'All Sections'
          };

      const result = await archiveService.downloadArchiveZip(config);
      if (result.success) {
        setSuccess(`Successfully re-exported historical archive.`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message);
        setTimeout(() => setError(null), 3000);
      }
    } catch (e) {
      setError("Download failed.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      semester: 'All Semesters',
      academic_year: 'All Years',
      doc_type: 'All Document Types',
      status: 'All Status',
      search_query: ''
    });
  };

  return {
    loading,
    error,
    success,
    documents,
    recentDownloads,
    filters,
    options,
    filteredOptions, // <-- EXPORT
    setFilteredOptions, // <-- EXPORT
    updateFilter,
    clearFilters,
    handleDownload,
    refresh: fetchData,
    reExportArchive
  };
}