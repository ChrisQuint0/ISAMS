/**
 * Direct Download Handler for Thesis Files
 * Route: /api/thesis/download/:fileId
 */
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const { fileId } = req.query;
    
    if (!fileId) {
      return res.status(400).json({ error: "File ID required" });
    }

    // Get OAuth client
    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Get file metadata
    const { data: fileMetadata } = await drive.files.get({
      fileId: fileId,
      fields: "name, mimeType",
    });

    // Set response headers for download
    res.setHeader("Content-Type", fileMetadata.mimeType || "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileMetadata.name}"`,
    );

    // Stream from Google Drive
    const response = await drive.files.get(
      { fileId: fileId, alt: "media" },
      { responseType: "stream" },
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
    console.error("Error downloading thesis file:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
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
