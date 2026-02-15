import { supabase } from "@/lib/supabaseClient";

export const facultyMonitorService = {
  /**
   * Get Faculty Monitor List (with filters)
   */
  getMonitoringData: async (filters) => {
    const { data, error } = await supabase.rpc('get_faculty_monitoring_fn', {
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
      supabase.from('faculty').select('department').neq('department', null),
      supabase.from('courses').select('course_code')
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
    const { error } = await supabase.from('notifications').insert({
      faculty_id: facultyId,
      notification_type: 'DEADLINE_REMINDER',
      subject: 'Urgent: Submission Reminder',
      message: 'This is a manual reminder to complete your faculty requirements.'
    });
    if (error) throw error;
    return true;
  },

  /**
   * Send Bulk Reminders
   */
  sendBulkReminders: async (dept, status) => {
    const { data, error } = await supabase.rpc('send_bulk_reminders_filter_fn', {
      p_department: dept === 'All Departments' ? null : dept,
      p_status: status === 'All Status' ? null : status
    });

    if (error) throw error;
    return { total_sent: data.count, message: data.message };
  }
};