import { supabase } from "@/lib/supabaseClient";

const BUCKET_NAME = "dynamic_logo";

export const logoService = {
  /**
   * Fetches the public URL of the dynamic logo.
   */
  getLogoUrl: async () => {
    try {
      const { data: files, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', {
          limit: 10,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError) {
        console.error("Storage list error:", listError);
        throw listError;
      }

      console.log("Files found in dynamic_logo bucket:", files);

      if (files && files.length > 0) {
        // Filter out any placeholders
        const logoFile = files.find(f => f.name !== '.emptyFolderPlaceholder');
        
        if (logoFile) {
          const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(logoFile.name);
          
          // Add a cache-busting query parameter
          return `${publicUrl}?v=${new Date(logoFile.updated_at).getTime()}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Error fetching logo URL:", error);
      return null;
    }
  },

  /**
   * Uploads a new logo, replacing any existing ones.
   */
  uploadLogo: async (file) => {
    try {
      // 1. List existing files to delete them
      const { data: files } = await supabase.storage
        .from(BUCKET_NAME)
        .list();

      if (files && files.length > 0) {
        const fileNames = files.map(f => f.name);
        await supabase.storage.from(BUCKET_NAME).remove(fileNames);
      }

      // 2. Upload new file with timestamp for cache busting
      const fileExt = file.name.split('.').pop();
      const fileName = `dynamic_ccs_logo_${Date.now()}.${fileExt}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 3. Return new public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      return `${publicUrl}?v=${Date.now()}`;
    } catch (error) {
      console.error("Error uploading logo:", error);
      throw error;
    }
  },

  /**
   * Deletes all files in the dynamic_logo bucket.
   */
  deleteLogo: async () => {
    try {
      const { data: files } = await supabase.storage
        .from(BUCKET_NAME)
        .list();

      if (files && files.length > 0) {
        const fileNames = files.map(f => f.name);
        await supabase.storage.from(BUCKET_NAME).remove(fileNames);
      }
      return true;
    } catch (error) {
      console.error("Error deleting logo:", error);
      throw error;
    }
  }
};
