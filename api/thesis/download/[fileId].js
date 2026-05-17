/**
 * Thesis File Download Handler
 * Lightweight handler for downloading thesis files from Google Drive
 */
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    // Extract fileId from URL
    const pathParts = req.url.split('/');
    const fileId = pathParts[pathParts.length - 1]?.split('?')[0];

    if (!fileId) {
      return res.status(400).json({ error: "File ID is required" });
    }

    // Get Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load OAuth token
    const { data: tokenRow } = await supabase
      .from("google_auth_tokens")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!tokenRow) {
      return res.status(401).json({ error: "Not authenticated with Google Drive" });
    }

    // Create OAuth client
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

    // Get file metadata
    const { data: fileMetadata } = await drive.files.get({
      fileId: fileId,
      fields: "name, mimeType",
    });

    // Set response headers
    res.setHeader("Content-Type", fileMetadata.mimeType || "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileMetadata.name}"`
    );

    // Stream file from Google Drive
    const response = await drive.files.get(
      { fileId: fileId, alt: "media" },
      { responseType: "stream" }
    );

    response.data
      .on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to stream file" });
        }
      })
      .pipe(res);
  } catch (error) {
    console.error("Error downloading file:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
}
