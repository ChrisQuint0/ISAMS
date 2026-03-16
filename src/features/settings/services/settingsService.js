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
   * Gets the Google OAuth URL for a specific user.
   */
  getGoogleAuthUrl: async (userId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/auth/google/url?userId=${userId}`);
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error fetching Google auth URL:", error);
      return null;
    }
  },

  /**
   * Gets the Google authentication status for a specific user.
   */
  getGoogleAuthStatus: async (userId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/auth/google/status/${userId}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching Google auth status:", error);
      return { authenticated: false };
    }
  },

  /**
   * Updates the value of a specific setting by ID.
   */
  updateSetting: async (id, value) => {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .upsert({ id, value, updated_at: new Date().toISOString() });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error updating setting ${id}:`, error);
      throw error;
    }
  }
};
