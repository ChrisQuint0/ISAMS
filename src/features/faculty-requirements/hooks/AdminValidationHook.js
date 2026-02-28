import { useState, useEffect, useCallback } from 'react';
import { validationService } from '../services/AdminValidationService';

export function useAdminValidation() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [queue, setQueue] = useState([]);
  const [recentApprovals, setRecentApprovals] = useState([]);
  const [stats, setStats] = useState({
    pending_count: 0,
    auto_approved_count: 0,
    rejected_count: 0,
    avg_processing_time: '-'
  });

  const [filters, setFilters] = useState({
    status: 'All Status',
    department: 'All Departments'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null); // FIX: Reset error before fetching
    try {
      const [queueData, recentData, statsData] = await Promise.all([
        validationService.getQueue(filters),
        validationService.getRecentApprovals(),
        validationService.getStats()
      ]);

      setQueue(queueData);
      setRecentApprovals(recentData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
      setError("Failed to load validation data.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const processAction = async (submission, action, remarks) => {
    try {
      const msg = await validationService.processAction(submission, action, remarks);
      await fetchData(); // Refresh data immediately
      return { success: true, message: msg };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const downloadFile = async (submissionId) => {
    try {
      const url = await validationService.getDownloadLink(submissionId);
      if (url) window.open(url, '_blank');
      else alert("Download link not available.");
    } catch (err) {
      console.error(err);
      alert("Failed to get download link.");
    }
  };

  const approveAll = async () => {
    try {
      const msg = await validationService.approveAllPending(filters.department);
      await fetchData();
      return { success: true, message: msg };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const runBotCheck = async (submissionId) => {
    try {
      const result = await validationService.runBotCheck(submissionId);
      // We don't automatically refresh because we likely want to update local state or just show results,
      // but refreshing ensures we get the updated 'bot_analysis' column data.
      await fetchData();
      return result;
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  return {
    loading,
    error,
    queue,
    recentApprovals,
    stats,
    filters,
    setFilters,
    processAction,
    approveAll,
    downloadFile,
    runBotCheck,
    refresh: fetchData
  };
}