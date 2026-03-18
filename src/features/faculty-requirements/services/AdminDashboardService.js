import { supabase } from '@/lib/supabaseClient';

export const dashboardService = {
  /**
   * Fetch all main stats
   */
  getStats: async () => {
    const { data, error } = await supabase.rpc('get_dashboard_stats_fs');
    if (error) throw error;
    return data;
  },

  /**
   * Fetch Recent Activities Table
   */
  getRecentActivity: async (limit = 50) => {
    const { data, error } = await supabase.rpc('get_admin_recent_activity_fs', { p_limit: limit });
    if (error) throw error;
    return data;
  },

  /**
   * Fetch Trends
   */
  getTrends: async (days = 30) => {
    const { data, error } = await supabase.rpc('get_submission_trends_fs', { p_days: days });
    if (error) throw error;
    return data;
  },

  /**
   * Trigger Bulk Reminders
   */
  sendBulkReminders: async () => {
    const { data, error } = await supabase.rpc('send_bulk_reminders_fs');
    if (error) throw error;
    return data;
  },

  /**
   * Send Single Reminder
   */
  sendIndividualReminder: async (facultyId, name) => {
    const { error } = await supabase.from('notifications_fs').insert({
      faculty_id: facultyId,
      notification_type: 'DEADLINE_REMINDER',
      subject: 'Reminder: Pending Document Submissions',
      message: `Dear ${name}, please check your pending submissions.`
    });
    if (error) throw error;
    return `Reminder sent to ${name}`;
  },

  /**
   * Fetch Top Contributors
   */
  getTopContributors: async () => {
    const { data, error } = await supabase.rpc('get_top_contributors_fs');
    if (error) throw error;
    return data;
  }
};