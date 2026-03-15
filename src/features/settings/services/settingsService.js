import { supabase } from "@/lib/supabaseClient";

const TABLE_NAME = "system_settings";

export const settingsService = {
  /**
   * Fetches the value of a specific setting by ID.
   */
  getSetting: async (id) => {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("value")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data?.value || null;
    } catch (error) {
      console.error(`Error fetching setting ${id}:`, error);
      return null;
    }
  },

  /**
   * Updates the value of a specific setting by ID.
   */
  updateSetting: async (id, value) => {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({ value, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error updating setting ${id}:`, error);
      throw error;
    }
  }
};
