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

      // FIX 2: Create a strict "Midnight Today" object to prevent timezone/time-of-day glitches
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // FIX 1: Manually calculate and inject the "status" string so the UI Grid renders badges correctly
      const mappedDeadlines = allDeadlines.map(d => {
        const deadlineDate = new Date(d.deadline_date);
        deadlineDate.setHours(0, 0, 0, 0);

        let status = 'Passed';
        if (d.is_active) {
          if (deadlineDate > today) status = 'Upcoming';
          else if (deadlineDate.getTime() === today.getTime()) status = 'Active'; // Due Today
        }
        return { ...d, status };
      });

      setDeadlines(mappedDeadlines);

      // Compute next deadline safely using the stripped dates
      const upcoming = mappedDeadlines
        .filter(d => {
          const dDate = new Date(d.deadline_date);
          dDate.setHours(0, 0, 0, 0);
          return dDate >= today && d.is_active;
        })
        .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date));

      const next = upcoming[0] || null;
      const daysLeft = next
        ? Math.ceil((new Date(next.deadline_date) - today) / (1000 * 60 * 60 * 24))
        : 0;

      setStats({
        ...statistics,
        next_deadline_type: next?.type_name || 'None', // Mapped from your RPC's 'type_name'
        days_left: daysLeft,
        on_time: 0, // Mocked for now, plug into real stats later if needed
        late: 0,
        pending: 0,
        total_submissions: 0
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
        .in('setting_key', ['current_semester', 'current_academic_year']);

      if (error) throw error;

      const newSettings = {};
      data?.forEach(s => {
        if (s.setting_key === 'current_semester') newSettings.semester = s.setting_value;
        if (s.setting_key === 'current_academic_year') newSettings.academic_year = s.setting_value;
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
      const result = await deadlineService.save(formData);
      setSuccess(result.message || "Deadline saved successfully.");
      await fetchData();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
      // FIX 3: Clear errors dynamically
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
      // FIX 3: Clear errors dynamically
      setTimeout(() => { setSuccess(null); setError(null); }, 3000);
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
      // FIX 3: Clear errors dynamically
      setTimeout(() => { setSuccess(null); setError(null); }, 3000);
    }
  };

  return {
    loading, error, success,
    deadlines, docTypes, stats,
    settings,
    refresh: fetchData,
    saveDeadline, deleteDeadline, handleBulkAction
  };
}