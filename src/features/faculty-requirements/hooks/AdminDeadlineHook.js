import { useState, useEffect, useCallback } from 'react';
import { deadlineService } from '../services/AdminDeadlineService';

export function useAdminDeadlines() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [deadlines, setDeadlines] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [stats, setStats] = useState({
    on_time: 0, late: 0, pending: 0,
    total_submissions: 0, next_deadline_type: '', days_left: 0
  });

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allDeadlines, types, statistics] = await Promise.all([
        deadlineService.getAll(),
        deadlineService.getDocTypes(),
        deadlineService.getStats()
      ]);
      setDeadlines(allDeadlines);
      setDocTypes(types);
      setStats(statistics);
    } catch (err) {
      console.error(err);
      setError("Failed to load deadline data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const saveDeadline = async (formData, isEdit = false) => {
    setLoading(true);
    try {
      const result = await deadlineService.save(formData);
      setSuccess(result.message);
      await fetchData();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const deleteDeadline = async (id) => {
    try {
      const result = await deadlineService.delete(id);
      setSuccess(result.message);
      await fetchData();
    } catch (err) {
      setError("Failed to delete deadline.");
    }
  };

  const handleBulkAction = async (action, value) => {
    setLoading(true);
    try {
      let result;
      if (action === 'EXTEND') result = await deadlineService.extendAll(value);
      if (action === 'GRACE') result = await deadlineService.applyGracePeriod(value);
      if (action === 'RESET') result = await deadlineService.resetToDefaults(value.semester, value.year);

      setSuccess(result.message);
      await fetchData();
    } catch (err) {
      setError("Bulk action failed.");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  return {
    loading, error, success,
    deadlines, docTypes, stats,
    refresh: fetchData,
    saveDeadline, deleteDeadline, handleBulkAction
  };
}