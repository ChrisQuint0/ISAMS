/**
 * File Operations Handler
 * Lists files from Google Drive folder
 */
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load OAuth token
    const { data: scopedTokens } = await supabase
      .from("google_auth_tokens")
      .select("*")
      .ilike("scope", "%googleapis.com/auth/drive%")
      .order("created_at", { ascending: false });

    const tokenRow = scopedTokens && scopedTokens.length > 0 ? scopedTokens[0] : null;

    if (!tokenRow) {
      return res.status(401).json({ error: "Not authenticated with Google Drive" });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: tokenRow.access_token,
      refresh_token: tokenRow.refresh_token,
      scope: tokenRow.scope,
      token_type: tokenRow.token_type,
      expiry_date: tokenRow.expiry_date,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Get folder ID from query or use default
    const folderId = req.query.folderId || process.env.VITE_GOOGLE_DRIVE_FOLDER_ID || "root";
    const query = `'${folderId}' in parents and trashed=false`;

    const response = await drive.files.list({
      pageSize: 100,
      fields: "nextPageToken, files(id, name, webViewLink, iconLink, createdTime, size, webContentLink, mimeType)",
      q: query,
      orderBy: "createdTime desc",
    });

    res.json(response.data.files || []);
  } catch (error) {
    console.error("Error listing files:", error);
    res.status(500).json({ error: error.message });
  }
}
