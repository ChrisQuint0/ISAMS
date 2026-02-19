import { supabase } from "@/lib/supabaseClient";

export const facultyMonitorService = {
  /**
   * Get Faculty Monitor List (with filters)
   */
  getMonitoringData: async (filters) => {
    const { data, error } = await supabase.rpc('get_faculty_monitoring_fs', {
      p_semester: filters.semester === 'All Semesters' ? null : filters.semester,
      p_academic_year: filters.academic_year === 'All Years' ? null : filters.academic_year,
      p_department: filters.department === 'All Departments' ? null : filters.department,
      p_status: filters.status === 'All Status' ? null : filters.status,
      p_search: filters.search || null
    });

    if (error) throw error;

    // Remap the SQL result to match what the UI expects (courses_json -> courses)
    return data.map(f => ({
      ...f,
      courses: f.courses_json || [] // Flatten the JSONB column
    }));
  },

  /**
   * Helper options
   */
  getOptions: async () => {
    const [depts, courses] = await Promise.all([
      supabase.from('faculty_fs').select('department').neq('department', null),
      supabase.from('courses_fs').select('course_code')
    ]);

    // Unique values
    return {
      departments: [...new Set(depts.data?.map(d => d.department))],
      courses: [...new Set(courses.data?.map(c => c.course_code))]
    };
  },

  /**
   * Send Single Reminder
   */
  sendReminder: async (facultyId) => {
    // 1. Log notification in DB
    const { error } = await supabase.from('notifications_fs').insert({
      faculty_id: facultyId,
      notification_type: 'DEADLINE_REMINDER',
      subject: 'Urgent: Submission Reminder',
      message: 'This is a manual reminder to complete your faculty requirements.'
    });
    if (error) throw error;

    // 2. Trigger Email via Edge Function (Placeholder)
    // In production, this would call your SendGrid integration
    /*
    await supabase.functions.invoke('send-email', {
      body: { 
        facultyId, 
        template: 'deadline_reminder',
        subject: 'Urgent: Submission Reminder'
      }
    });
    */

    return true;
  },

  /**
   * Send Bulk Reminders
   */
  sendBulkReminders: async (dept, status) => {
    // 1. Log notifications via RPC
    const { data, error } = await supabase.rpc('send_bulk_reminders_filter_fs', {
      p_department: dept === 'All Departments' ? null : dept,
      p_status: status === 'All Status' ? null : status
    });

    if (error) throw error;

    // 2. Trigger Bulk Email via Edge Function (Placeholder)
    /*
    await supabase.functions.invoke('send-bulk-emails', {
      body: { 
        department: dept === 'All Departments' ? null : dept, 
        status: status === 'All Status' ? null : status,
        template: 'deadline_reminder'
      }
    });
    */

    return { total_sent: data.count, message: data.message };
  },

  /**
   * Export Data to CSV
   */
  exportToCSV: (data, filename = 'faculty_monitoring_report.csv') => {
    if (!data || !data.length) return;

    const headers = ["Faculty ID", "Name", "Department", "Status", "Overall Progress", "Pending", "Late", "Assigned Courses"];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '';
      const stringValue = String(str);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const rows = data.map(f => [
      escapeCsv(f.faculty_id),
      escapeCsv(`${f.first_name} ${f.last_name}`),
      escapeCsv(f.department),
      escapeCsv(f.status),
      `${f.overall_progress}%`,
      f.pending_submissions,
      f.late_submissions,
      escapeCsv(f.courses ? f.courses.map(c => c.course_code).join('; ') : '')
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};