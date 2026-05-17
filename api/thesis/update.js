/**
 * Thesis Update Handler
 * Updates thesis entry, authors, and file
 */
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id, entry, authors, gdriveFile } = req.body;

  if (!id || !entry || !authors) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch old entry for file deletion
    const { data: oldEntry } = await supabaseAdmin
      .from("thesis_entries")
      .select("*, files:thesis_files(*)")
      .eq("id", id)
      .single();

    // 2. Update thesis entry
    const { error: entryUpdateError } = await supabaseAdmin
      .from("thesis_entries")
      .update(entry)
      .eq("id", id);

    if (entryUpdateError) throw entryUpdateError;

    // 3. Update authors (delete and re-insert)
    await supabaseAdmin.from("thesis_authors").delete().eq("thesis_id", id);

    const authorsToInsert = authors.map((author, index) => ({
      thesis_id: id,
      first_name: author.firstName,
      last_name: author.lastName,
      display_order: index + 1,
    }));

    const { error: authorsInsertError } = await supabaseAdmin
      .from("thesis_authors")
      .insert(authorsToInsert);

    if (authorsInsertError) throw authorsInsertError;

    // 4. Update file if provided
    if (gdriveFile && oldEntry?.files?.[0]?.storage_path) {
      // Delete old file from Google Drive
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
          await drive.files.delete({ fileId: oldEntry.files[0].storage_path });
        }
      } catch (deleteError) {
        console.error("Error deleting old file:", deleteError);
      }

      // Update file metadata
      const fileMetadata = {
        original_filename: entry.title + ".pdf",
        storage_path: gdriveFile.id,
        storage_bucket: "google-drive",
        mime_type: "application/pdf",
      };

      const { error: fileUpdateError } = await supabaseAdmin
        .from("thesis_files")
        .update(fileMetadata)
        .eq("thesis_id", id);

      if (fileUpdateError) throw fileUpdateError;
    }

    console.log(`✅ Updated thesis: ${entry.title} (${id})`);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating thesis:", error);
    res.status(500).json({ error: error.message });
  }
}
