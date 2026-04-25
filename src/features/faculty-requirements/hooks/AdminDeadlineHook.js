import { useState, useEffect, useCallback } from 'react';
import { deadlineService } from '../services/AdminDeadlineService';
import { supabase } from '@/lib/supabaseClient';

export function useAdminDeadlines() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [deadlines, setDeadlines] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [settings, setSettings] = useState({ semester: '', academic_year: '' });
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

      setDocTypes(types);

      // Helper to parse "YYYY-MM-DD" as local date to avoid UTC shift
      const parseLocalDate = (dateStr) => {
        if (!dateStr) return null;
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
      };

      // Map deadlines — DB already computes status & hard_cutoff_date
      const mappedDeadlines = allDeadlines.map(d => {
        const dueDate = parseLocalDate(d.deadline_date);
        const startDate = parseLocalDate(d.issue_date);
        const hardCutoff = parseLocalDate(d.hard_cutoff_date) || (() => {
          // Fallback: compute locally if DB column missing
          const c = new Date(dueDate);
          c.setDate(c.getDate() + (d.grace_period_days || 0));
          return c;
        })();

        return {
          ...d,
          // Trust the DB-computed status; fallback to 'Passed' if missing
          status: d.status || 'Passed',
          deadline_date_obj: dueDate,
          start_date_obj: startDate,
          hard_cutoff_obj: hardCutoff
        };
      });

      setDeadlines(mappedDeadlines);

      // Compute next deadline safely using the stripped dates
      const upcoming = mappedDeadlines
        .filter(d => (d.status === 'Active' || d.status === 'Grace Period') && d.is_active)
        .sort((a, b) => {
          const dateDiff = a.deadline_date_obj - b.deadline_date_obj;
          if (dateDiff !== 0) return dateDiff;
          return a.type_name.localeCompare(b.type_name);
        });

      const next = upcoming[0] || null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const daysLeft = next
        ? Math.floor((next.deadline_date_obj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      setStats({
        ...statistics,
        next_deadline: next,
        days_left: daysLeft
      });

    } catch (err) {
      console.error(err);
      setError("Failed to load deadline data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('systemsettings_fs')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'current_semester',
          'current_academic_year',
          'general_default_deadline',
          'general_grace_period'
        ]);

      if (error) throw error;

      const newSettings = {};
      data?.forEach(s => {
        if (s.setting_key === 'current_semester') newSettings.semester = s.setting_value;
        if (s.setting_key === 'current_academic_year') newSettings.academic_year = s.setting_value;
        if (s.setting_key === 'general_default_deadline') newSettings.default_deadline = parseInt(s.setting_value) || 14;
        if (s.setting_key === 'general_grace_period') newSettings.default_grace = parseInt(s.setting_value) || 3;
      });
      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (err) {
      console.error("Failed to load system settings:", err.message);
      setError("Failed to load system settings.");
    }
  }, []);

  useEffect(() => {
    fetchData();
    loadSettings();
  }, [fetchData, loadSettings]);

  // Actions
  const saveDeadline = async (formData, isEdit = false) => {
    setLoading(true);
    try {
      // Pre-save validation for duplicates
      const isDuplicate = deadlines.some(d => 
        d.deadline_id !== formData.deadline_id && // Exclude self if editing
        d.doc_type_id === parseInt(formData.doc_type_id) && 
        d.semester === formData.semester && 
        d.academic_year === formData.academic_year
      );
      
      if (isDuplicate) {
        throw new Error("A deadline for this document type already exists for this period.");
      }

      const result = await deadlineService.save(formData);
      setSuccess(result.message || "Deadline saved successfully.");
      await fetchData();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
      setTimeout(() => { setSuccess(null); setError(null); }, 3000);
    }
  };

  const deleteDeadline = async (id) => {
    try {
      const result = await deadlineService.delete(id);
      setSuccess(result.message);
      await fetchData();
    } catch (err) {
      setError("Failed to delete deadline.");
    } finally {
      setTimeout(() => { setSuccess(null); setError(null); }, 3000);
    }
  };

  const handleBulkAction = async (action, value) => {
    setLoading(true);
    try {
      let result;
      if (action === 'EXTEND') result = await deadlineService.extendAll(value);
      if (action === 'GRACE') result = await deadlineService.applyGracePeriod(value);

      setSuccess(result.message);
      await fetchData();
    } catch (err) {
      setError("Bulk action failed.");
    } finally {
      setLoading(false);
      setTimeout(() => { setSuccess(null); setError(null); }, 3000);
    }
  };

  return {
    loading, error, success,
    deadlines, docTypes, stats,
    settings,
    refresh: fetchData,
    saveDeadline, deleteDeadline, handleBulkAction,
    setError
  };
}