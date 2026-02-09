import { useState, useEffect, useCallback } from 'react';
import { archiveService } from '../services/AdminArchiveService';

export function useAdminArchive() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [documents, setDocuments] = useState([]);
  
  // Default Stats
  const [stats, setStats] = useState({
    total_documents: 0,
    storage_used_bytes: 0,
    storage_percentage: 0,
    documents_by_type: {}
  });

  // Filters State
  const [filters, setFilters] = useState({
    semester: 'All Semesters',
    academic_year: 'All Years',
    department: 'All Departments',
    doc_type: 'All Document Types',
    status: 'All Status',
    search_query: ''
  });

  // Options State
  const [options, setOptions] = useState({
    departments: [],
    types: [],
    semesters: ['2nd Sem', '1st Sem', 'Summer'],
    years: ['2023-2024', '2022-2023', '2021-2022']
  });

  // Initialize
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const opts = await archiveService.getOptions();
        setOptions(prev => ({ ...prev, ...opts }));
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
      const [docs, statistics] = await Promise.all([
        archiveService.getDocuments(filters),
        archiveService.getStatistics()
      ]);
      setDocuments(docs);
      setStats(statistics);
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
        if (result.success) setSuccess(result.message);
        else setError(result.message);
        
        setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
        setError("Download failed.");
    }
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
        semester: 'All Semesters',
        academic_year: 'All Years',
        department: 'All Departments',
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
    stats,
    filters,
    options,
    updateFilter,
    clearFilters,
    handleDownload,
    refresh: fetchData
  };
}