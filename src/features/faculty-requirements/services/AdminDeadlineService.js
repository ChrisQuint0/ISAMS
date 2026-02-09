import { supabase } from '@/lib/supabaseClient';

export const deadlineService = {
  /**
   * Get all deadlines
   */
  getAll: async () => {
    const { data, error } = await supabase.rpc('get_all_deadlines_fn');
    if (error) throw error;
    return data;
  },

  /**
   * Get Document Types (for the dropdown)
   */
  getDocTypes: async () => {
    const { data, error } = await supabase
      .from('DocumentTypes')
      .select('doc_type_id, type_name')
      .order('type_name');
    
    if (error) throw error;
    // Remap for UI consistency
    return data.map(d => ({ id: d.doc_type_id, name: d.type_name }));
  },

  /**
   * Create or Update Deadline
   */
  save: async (deadline) => {
    const { data, error } = await supabase.rpc('upsert_deadline_fn', {
      p_semester: deadline.semester,
      p_year: deadline.academic_year,
      p_doc_type_id: deadline.doc_type_id,
      p_date: deadline.deadline_date,
      p_grace: deadline.grace_period_days,
      p_id: deadline.deadline_id || null
    });
    
    if (error) throw error;
    if (!data.success) throw new Error(data.message);
    return data;
  },

  /**
   * Delete Deadline
   */
  delete: async (id) => {
    const { data, error } = await supabase.rpc('delete_deadline_fn', { p_id: id });
    if (error) throw error;
    return data; // Returns { success, mode, message }
  },

  /**
   * Get Statistics
   */
  getStats: async () => {
    const { data, error } = await supabase.rpc('get_deadline_stats_fn');
    if (error) throw error;
    return data;
  },

  /**
   * Bulk Actions
   */
  extendAll: async (days) => {
    const { data, error } = await supabase.rpc('bulk_deadline_op_fn', {
      p_operation: 'EXTEND',
      p_value: days
    });
    if (error) throw error;
    return { success: true, message: data };
  },

  applyGracePeriod: async (days) => {
    const { data, error } = await supabase.rpc('bulk_deadline_op_fn', {
      p_operation: 'GRACE',
      p_value: days
    });
    if (error) throw error;
    return { success: true, message: data };
  }
};