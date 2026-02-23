import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/AdminDashboardService';
import { supabase } from '@/lib/supabaseClient';

export function useAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Data States
  const [stats, setStats] = useState({
    overall_completion: 0,
    pending_submissions: 0,
    validation_queue: 0,
    on_time_rate: 0,
    total_faculty: 0,
    total_courses: 0,
    total_submissions: 0
  });
  const [departmentProgress, setDepartmentProgress] = useState([]);
  const [facultyStatus, setFacultyStatus] = useState([]);
  const [trends, setTrends] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, deptData, facultyData, trendsData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getDeptProgress(),
        dashboardService.getFacultyStatus(),
        dashboardService.getTrends()
      ]);

      setStats(statsData);
      setDepartmentProgress(deptData);
      setFacultyStatus(facultyData);
      setTrends(trendsData);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch System Settings (Semester/AY)
  const [settings, setSettings] = useState({ semester: '', academic_year: '' });

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('systemsettings_fs')
        .select('setting_key, setting_value')
        .in('setting_key', ['current_semester', 'current_academic_year']);

      const newSettings = {};
      data?.forEach(s => {
        if (s.setting_key === 'current_semester') newSettings.semester = s.setting_value;
        if (s.setting_key === 'current_academic_year') newSettings.academic_year = s.setting_value;
      });
      setSettings(newSettings);
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchData();
    loadSettings();
  }, [fetchData]);

  // Actions
  const sendBulkReminders = async () => {
    try {
      const result = await dashboardService.sendBulkReminders();
      // FIX 1: Extract the message string from the JSON object
      setSuccess(result.message);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
    } catch (err) {
      setError("Failed to send bulk reminders");
      // FIX 3: Clear sticky errors
      setTimeout(() => setError(null), 3000);
    }
  };

  const sendIndividualReminder = async (faculty) => {
    try {
      const msg = await dashboardService.sendIndividualReminder(faculty.faculty_id, faculty.name);
      setSuccess(msg);

      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
    } catch (err) {
      setError("Failed to send reminder");
      // FIX 3: Clear sticky errors
      setTimeout(() => setError(null), 3000);
    }
  };

  const refresh = () => {
    fetchData();
    loadSettings();
  };

  return {
    loading,
    error,
    success,
    stats,
    departmentProgress,
    facultyStatus,
    trends,
    settings,
    refresh,
    sendBulkReminders,
    sendIndividualReminder
  };
}