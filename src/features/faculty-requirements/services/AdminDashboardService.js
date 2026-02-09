import { supabase } from '@/lib/supabaseClient';

export const dashboardService = {
  /**
   * Fetch all main stats
   */
  getStats: async () => {
    const { data, error } = await supabase.rpc('get_dashboard_stats_fn');
    if (error) throw error;
    return data;
  },

  /**
   * Fetch Department Progress
   */
  getDeptProgress: async () => {
    const { data, error } = await supabase.rpc('get_department_progress_fn');
    if (error) throw error;
    return data;
  },

  /**
   * Fetch Faculty List with calculated status
   */
  getFacultyStatus: async () => {
    const { data, error } = await supabase.rpc('get_faculty_status_overview_fn');
    if (error) throw error;
    return data;
  },

  /**
   * Fetch Trends
   */
  getTrends: async (days = 30) => {
    const { data, error } = await supabase.rpc('get_submission_trends_fn', { p_days: days });
    if (error) throw error;
    return data;
  },

  /**
   * Trigger Bulk Reminders
   */
  sendBulkReminders: async () => {
    const { data, error } = await supabase.rpc('send_bulk_reminders_fn');
    if (error) throw error;
    return data;
  },

  /**
   * Send Single Reminder
   */
  sendIndividualReminder: async (facultyId, name) => {
    const { error } = await supabase.from('Notifications').insert({
      faculty_id: facultyId,
      notification_type: 'DEADLINE_REMINDER',
      subject: 'Reminder: Pending Document Submissions',
      message: `Dear ${name}, please check your pending submissions.`
    });
    if (error) throw error;
    return `Reminder sent to ${name}`;
  }
};