import { supabase } from "@/lib/supabaseClient";

export const validationService = {
  /**
   * Fetch the pending queue (Submitted/Validated items)
   */
  getQueue: async (filters) => {
    // Determine status filter
    let statusFilter = null;
    if (filters.status === 'PENDING') statusFilter = 'PENDING';
    else if (filters.status === 'FAILED') statusFilter = 'FAILED';

    const { data, error } = await supabase.rpc('get_validation_queue_fs', {
      p_status: statusFilter,
      p_department: filters.department === 'All Departments' ? null : filters.department
    });

    if (error) throw error;
    return data;
  },

  /**
   * Fetch recently approved items (Matches Wireframe)
   */
  getRecentApprovals: async () => {
    const { data, error } = await supabase
      .from('submissions_fs')
      .select(`
        submission_id,
        original_filename,
        approved_at,
        doc_type:documenttypes_fs(type_name),
        faculty:faculty_fs(first_name, last_name)
      `)
      .eq('submission_status', 'APPROVED')
      .order('approved_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    // Transform for UI
    return data.map(item => ({
      id: item.submission_id,
      filename: item.original_filename,
      type: item.doc_type?.type_name || 'Document',
      faculty: `${item.faculty?.first_name} ${item.faculty?.last_name}`,
      date: new Date(item.approved_at).toLocaleDateString()
    }));
  },

  /**
   * Get Validation Stats
   */
  getStats: async () => {
    const { data, error } = await supabase.rpc('get_validation_stats_fs');
    if (error) throw error;
    return data;
  },

  /**
   * Process Action (Approve/Reject)
   */
  processAction: async (submissionId, action, remarks) => {
    const { data, error } = await supabase.rpc('process_validation_action_fs', {
      p_submission_id: submissionId,
      p_action: action,
      p_remarks: remarks,
      p_admin_id: 1 // TODO: Replace with logged-in user ID
    });

    if (error) throw error;
    return data;
  },

  /**
   * Get Download Link
   */
  getDownloadLink: async (submissionId) => {
    const { data, error } = await supabase
      .from('submissions_fs')
      .select('storage_provider, gdrive_web_view_link, gdrive_download_link, gdrive_file_id')
      .eq('submission_id', submissionId)
      .single();

    if (error) throw error;

    if (data.storage_provider === 'GOOGLE_DRIVE') {
      return data.gdrive_download_link ||
        `https://drive.google.com/uc?export=download&id=${data.gdrive_file_id}`;
    }
    return null;
  },

  /**
   * Approve All Pending
   */
  approveAllPending: async (department) => {
    const { data, error } = await supabase.rpc('approve_all_pending_fs', {
      p_department: department === 'All Departments' ? null : department
    });

    if (error) throw error;
    return data;
  },

  runBotCheck: async (submissionId) => {
    const { data, error } = await supabase.rpc('run_bot_check_fs', {
      p_submission_id: submissionId
    });
    if (error) throw error;
    return { success: true, data };
  }
};