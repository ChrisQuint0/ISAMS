/**
 * Thesis Update Handler
 * Route: /api/thesis/update
 */
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import getRawBody from "raw-body";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawBody = await getRawBody(req, { limit: "10mb" });
    const { id, entry, authors, gdriveFile } = JSON.parse(rawBody.toString());

    if (!id || !entry || !authors) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { supabaseAdmin } = await getSupabaseClients();

    const { data: oldEntry } = await supabaseAdmin
      .from("thesis_entries")
      .select("*, files:thesis_files(*)")
      .eq("id", id)
      .single();

    await supabaseAdmin.from("thesis_entries").update(entry).eq("id", id);
    await supabaseAdmin.from("thesis_authors").delete().eq("thesis_id", id);

    const authorsToInsert = authors.map((author, index) => ({
      thesis_id: id,
      first_name: author.firstName,
      last_name: author.lastName,
      display_order: index + 1,
    }));
    await supabaseAdmin.from("thesis_authors").insert(authorsToInsert);

    if (gdriveFile && oldEntry?.files?.[0]?.storage_path) {
      try {
        const { oauth2Client } = await getAuthClient();
        const drive = google.drive({ version: "v3", auth: oauth2Client });
        await drive.files.delete({ fileId: oldEntry.files[0].storage_path });
      } catch (e) {
        console.error("Error deleting old file:", e);
      }

      await supabaseAdmin
        .from("thesis_files")
        .update({
          original_filename: entry.title + ".pdf",
          storage_path: gdriveFile.id,
        })
        .eq("thesis_id", id);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function getAuthClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: tokenRow } = await supabase
    .from("google_auth_tokens")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!tokenRow) {
    throw new Error("Not authenticated with Google Drive");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  oauth2Client.setCredentials({
    access_token: tokenRow.access_token,
    refresh_token: tokenRow.refresh_token,
    scope: tokenRow.scope,
    token_type: tokenRow.token_type,
    expiry_date: tokenRow.expiry_date,
  });

  return { oauth2Client };
}

async function getSupabaseClients() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabase = createClient(
    supabaseUrl,
    process.env.VITE_SUPABASE_ANON_KEY,
  );
  const supabaseAdmin = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  return { supabase, supabaseAdmin };
}
