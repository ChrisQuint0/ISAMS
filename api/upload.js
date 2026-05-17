/**
 * Generic File Upload Handler for Submissions
 * Handles file uploads to Google Drive for faculty submissions
 */
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { Readable } from "stream";
import getRawBody from "raw-body";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load OAuth token (pick most recent Drive-scoped token)
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

    // Parse multipart data
    const contentType = req.headers["content-type"] || "";
    
    if (!contentType.includes("multipart/form-data")) {
      return res.status(400).json({ error: "Content-Type must be multipart/form-data" });
    }

    const rawBody = await getRawBody(req, {
      length: req.headers["content-length"],
      limit: "50mb",
    });

    const boundary = contentType.split("boundary=")[1];
    if (!boundary) {
      return res.status(400).json({ error: "No boundary found" });
    }

    // Simple multipart parsing
    const parts = rawBody.toString("binary").split(`--${boundary}`);
    let fileBuffer = null;
    let fileName = "upload";
    let mimeType = "application/octet-stream";
    let folderId = process.env.VITE_GOOGLE_DRIVE_FOLDER_ID || "root";

    for (const part of parts) {
      if (part.includes('Content-Disposition')) {
        // Check if this is the folderId field
        if (part.includes('name="folderId"')) {
          const folderMatch = part.match(/\r\n\r\n([^\r\n]+)/);
          if (folderMatch) folderId = folderMatch[1].trim();
        }
        
        // Check if this is a file
        const fileNameMatch = part.match(/filename="([^"]+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
          
          // Extract mime type
          const mimeMatch = part.match(/Content-Type:\s*([^\r\n]+)/i);
          if (mimeMatch) mimeType = mimeMatch[1].trim();
          
          // Extract file content
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

    // Check for duplicates
    const query = `name='${fileName.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed=false`;
    const { data: existingFiles } = await drive.files.list({
      q: query,
      fields: "files(id, name)",
      pageSize: 1,
    });

    if (existingFiles.files && existingFiles.files.length > 0) {
      return res.status(409).json({
        error: "File already exists",
        existingFileId: existingFiles.files[0].id,
      });
    }

    // Upload to Google Drive
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType: mimeType,
      body: Readable.from(fileBuffer),
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, name, webViewLink, iconLink, createdTime, size, webContentLink",
    });

    console.log(`✅ Uploaded file: ${fileName} to folder ${folderId}`);
    res.json(file.data);
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: error.message });
  }
}
