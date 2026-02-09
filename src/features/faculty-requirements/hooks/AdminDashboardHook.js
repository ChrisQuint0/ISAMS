import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/AdminDashboardService';

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

  // Initial Load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const sendBulkReminders = async () => {
    try {
      const msg = await dashboardService.sendBulkReminders();
      setSuccess(msg);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to send bulk reminders");
    }
  };

  const sendIndividualReminder = async (faculty) => {
    try {
      const msg = await dashboardService.sendIndividualReminder(faculty.faculty_id, faculty.name);
      setSuccess(msg);
      // Optimistic update: change status to Reminded
      setFacultyStatus(prev => prev.map(f => 
        f.faculty_id === faculty.faculty_id ? { ...f, status: 'Reminded' } : f
      ));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to send reminder");
    }
  };

  return {
    loading,
    error,
    success,
    stats,
    departmentProgress,
    facultyStatus,
    trends,
    refresh: fetchData,
    sendBulkReminders,
    sendIndividualReminder
  };
}