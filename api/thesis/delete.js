/**
 * Thesis Delete Handler
 * Route: /api/thesis/delete
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
    const rawBody = await getRawBody(req, { limit: "1mb" });
    const { id } = JSON.parse(rawBody.toString());

    if (!id) {
      return res.status(400).json({ error: "ID required" });
    }

    const { supabaseAdmin } = await getSupabaseClients();

    const { data: thesis } = await supabaseAdmin
      .from("thesis_entries")
      .select("files:thesis_files(storage_path)")
      .eq("id", id)
      .single();

    if (thesis?.files) {
      try {
        const { oauth2Client } = await getAuthClient();
        const drive = google.drive({ version: "v3", auth: oauth2Client });
        for (const file of thesis.files) {
          if (file.storage_path) {
            await drive.files.delete({ fileId: file.storage_path });
          }
        }
      } catch (e) {
        console.error("Error deleting files:", e);
      }
    }

    await supabaseAdmin
      .from("thesis_entries")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id);

    res.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
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
