/**
 * Thesis File Upload Handler
 * Lightweight handler for uploading thesis files to Google Drive
 */
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { Readable } from "stream";
import getRawBody from "raw-body";

export const config = {
  api: {
    bodyParser: false, // Disable default body parser for file uploads
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
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

    // Parse multipart form data manually (simplified for Vercel)
    const contentType = req.headers["content-type"] || "";
    
    if (!contentType.includes("multipart/form-data")) {
      return res.status(400).json({ error: "Content-Type must be multipart/form-data" });
    }

    // Get raw body
    const rawBody = await getRawBody(req, {
      length: req.headers["content-length"],
      limit: "50mb",
    });

    // Extract boundary
    const boundary = contentType.split("boundary=")[1];
    if (!boundary) {
      return res.status(400).json({ error: "No boundary found in multipart data" });
    }

    // Parse multipart data (simple implementation)
    const parts = rawBody.toString("binary").split(`--${boundary}`);
    let fileBuffer = null;
    let fileName = "upload.pdf";
    let folderId = "1oTrBXMT3KxBORnVBtaGJ0JlSeiJ1GgmD"; // Default thesis folder

    for (const part of parts) {
      if (part.includes('Content-Disposition')) {
        // Extract filename if present
        const fileNameMatch = part.match(/filename="([^"]+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
          
          // Extract file content (after double CRLF)
          const contentStart = part.indexOf('\r\n\r\n') + 4;
          const contentEnd = part.lastIndexOf('\r\n');
          if (contentStart > 3 && contentEnd > contentStart) {
            const binaryContent = part.substring(contentStart, contentEnd);
            fileBuffer = Buffer.from(binaryContent, 'binary');
          }
        }
      }
    }

    if (!fileBuffer) {
      return res.status(400).json({ error: "No file found in upload" });
    }

    // Add timestamp to filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const finalFileName = `${timestamp}-${fileName}`;

    // Upload to Google Drive
    const fileMetadata = {
      name: finalFileName,
      parents: [folderId],
    };

    const media = {
      mimeType: "application/pdf",
      body: Readable.from(fileBuffer),
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, name, webViewLink, webContentLink",
    });

    console.log(`✅ Uploaded file: ${finalFileName} (${file.data.id})`);
    res.json(file.data);
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: error.message });
  }
}
