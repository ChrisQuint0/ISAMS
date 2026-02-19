import { useState, useEffect, useCallback } from 'react';
import { facultyMonitorService } from '../services/AdminFacultyMonitoringService';

export function useFacultyMonitor() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [facultyList, setFacultyList] = useState([]);
  const [options, setOptions] = useState({ departments: [], courses: [] });

  // Filters State
  const [filters, setFilters] = useState({
    department: 'All Departments',
    semester: 'All Semesters',
    academic_year: 'All Years',
    status: 'All Status',
    course: 'All Courses',
    search: ''
  });

  // Fetch Options Once
  useEffect(() => {
    facultyMonitorService.getOptions().then(setOptions);
  }, []);

  // Fetch Data on Filter Change
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await facultyMonitorService.getMonitoringData(filters);

      // Frontend Filtering for "Courses" (Since SQL filtering nested JSON is hard)
      let filteredData = data;
      if (filters.course !== 'All Courses') {
        filteredData = data.filter(f =>
          f.courses.some(c => c.course_code === filters.course || c.course_name.includes(filters.course))
        );
      }

      setFacultyList(filteredData);
    } catch (err) {
      console.error(err);
      setError("Failed to load faculty data.");
    } finally {
      setLoading(false);
    }
  }, [filters]); // Dependencies

  // Debounce Fetch
  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Actions
  const sendReminder = async (facultyId) => {
    try {
      await facultyMonitorService.sendReminder(facultyId);
      setSuccess("Reminder sent successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to send reminder.");
    }
  };

  const sendBulkReminders = async () => {
    try {
      const res = await facultyMonitorService.sendBulkReminders(filters.department, filters.status);
      setSuccess(res.message);
      setTimeout(() => setSuccess(null), 3000);
      return res;
    } catch (err) {
      setError("Failed to send bulk reminders.");
    }
  };

  const exportCSV = () => {
    // Use service's robust export
    facultyMonitorService.exportToCSV(facultyList, `faculty_report_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return {
    loading, error, success,
    facultyList, options, filters, setFilters,
    sendReminder, sendBulkReminders, exportCSV,
    refresh: fetchData
  };
}