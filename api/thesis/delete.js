/**
 * Thesis Delete Handler
 * Soft deletes thesis and removes files from Google Drive
 */
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Thesis ID required" });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch thesis info for file deletion
    const { data: thesis } = await supabaseAdmin
      .from("thesis_entries")
      .select("title, files:thesis_files(storage_path)")
      .eq("id", id)
      .single();

    // 2. Delete files from Google Drive
    if (thesis?.files) {
      try {
        const supabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
        const { data: tokenRow } = await supabase
          .from("google_auth_tokens")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (tokenRow) {
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
          );
          oauth2Client.setCredentials({
            access_token: tokenRow.access_token,
            refresh_token: tokenRow.refresh_token,
          });

          const drive = google.drive({ version: "v3", auth: oauth2Client });
          
          for (const file of thesis.files) {
            if (file.storage_path) {
              try {
                await drive.files.delete({ fileId: file.storage_path });
                console.log(`✅ Deleted file: ${file.storage_path}`);
              } catch (driveError) {
                console.error(`Failed to delete file ${file.storage_path}:`, driveError.message);
              }
            }
          }
        }
      } catch (authError) {
        console.error("Error loading auth:", authError);
      }
    }

    // 3. Soft delete in database
    const { error: deleteError } = await supabaseAdmin
      .from("thesis_entries")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (deleteError) throw deleteError;

    console.log(`✅ Deleted thesis: ${thesis?.title} (${id})`);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting thesis:", error);
    res.status(500).json({ error: error.message });
  }
}
