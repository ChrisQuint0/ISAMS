import express from "express";
import cors from "cors";
import multer from "multer";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import JSZip from "jszip";

// Load environment variables from .env.local
dotenv.config({ path: "./.env.local" });

const app = express();
const port = 3000;

// Config
const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.VITE_GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/oauth2callback";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const GOOGLE_DRIVE_FOLDER_ID = process.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Multer for file uploads
const upload = multer({ dest: "uploads/" });

// --- Routes ---

// 1. Auth URL
app.get("/api/auth", (req, res) => {
  const scopes = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline", // Important for refresh token
    scope: scopes,
    prompt: "consent", // Force consent to get refresh token
  });

  res.json({ url });
});

// 2. OAuth Callback
app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save tokens to Supabase
    const { error } = await supabase.from("google_auth_tokens").upsert({
      id: 1, // Single user mode for test
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token, // Only present if access_type=offline & prompt=consent
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).send("Error saving tokens");
    }

    res.send("Authentication successful! You can close this window and return to the app.");
  } catch (error) {
    console.error("Error getting tokens:", error);
    res.status(500).send("Authentication failed");
  }
});

// Helper to load token
async function loadToken() {
  const { data, error } = await supabase
    .from("google_auth_tokens")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) return null;

  oauth2Client.setCredentials({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    scope: data.scope,
    token_type: data.token_type,
    expiry_date: data.expiry_date,
  });

  return oauth2Client;
}

// 3. List Files
app.get("/api/files", async (req, res) => {
  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Not authenticated" });

    const drive = google.drive({ version: "v3", auth });

    // Get folderId from query, fallback to env var
    const folderId = req.query.folderId || GOOGLE_DRIVE_FOLDER_ID;

    // Filter by folder ID
    const query = `'${folderId}' in parents and trashed=false`;

    const response = await drive.files.list({
      pageSize: 10,
      fields: "nextPageToken, files(id, name, webViewLink, iconLink)",
      q: query,
    });

    res.json(response.data.files);
  } catch (error) {
    console.error("Error listing files:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Upload File
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Not authenticated" });

    const drive = google.drive({ version: "v3", auth });

    // Get folderId from body, fallback to env var
    const folderId = req.body.folderId || GOOGLE_DRIVE_FOLDER_ID;

    const fileMetadata = {
      name: req.file.originalname,
      parents: [folderId], // Upload to specific folder
    };
    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(req.file.path),
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, name, webViewLink",
    });

    // Cleanup temp file
    fs.unlinkSync(req.file.path);

    res.json(file.data);
  } catch (error) {
    console.error("Error uploading file:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: error.message });
  }
});

// 4.5 Ensure Folder Structure Endpoint
app.post("/api/folders/ensure", async (req, res) => {
  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Not authenticated" });

    const drive = google.drive({ version: "v3", auth });

    const rootFolderId = req.body.rootFolderId || GOOGLE_DRIVE_FOLDER_ID;
    const facultyName = req.body.facultyName;
    const termName = req.body.termName;

    let targetFolderId = rootFolderId;

    // Dynamically create or resolve the Faculty Name folder
    if (facultyName) {
      targetFolderId = await getOrCreateFolder(drive, facultyName, targetFolderId);
    }

    // Dynamically create or resolve the Semester/Term folder
    if (termName) {
      targetFolderId = await getOrCreateFolder(drive, termName, targetFolderId);
    }

    res.json({ targetFolderId });
  } catch (error) {
    console.error("Error ensuring folder structure:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Check Auth Status
app.get("/api/status", async (req, res) => {
  const { data } = await supabase
    .from("google_auth_tokens")
    .select("id")
    .eq("id", 1)
    .single();

  res.json({ authenticated: !!data });
});

// 6. Export Admin Archive as ZIP (using JSZip)
app.post("/api/archive/export", async (req, res) => {
  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Not authenticated with Google Drive" });

    const drive = google.drive({ version: "v3", auth });
    const { semester, academic_year, department } = req.body;

    // 1. Translate 'All' strings back to null for the SQL RPC
    const p_semester = (semester === 'All Semesters' || semester === 'ALL') ? null : semester;
    const p_academic_year = (academic_year === 'All Years' || academic_year === 'ALL') ? null : academic_year;
    const p_department = (department === 'All Departments' || department === 'ALL') ? null : department;

    // 2. Fetch the file links from Supabase
    const { data: files, error } = await supabase.rpc('get_archive_export_links_fs', {
      p_semester,
      p_academic_year,
      p_department
    });

    if (error) throw error;
    if (!files || files.length === 0) {
      return res.status(404).json({ message: "No files found for this configuration." });
    }

    // 3. Set up the ZIP streaming response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="Archive.zip"`);

    // 4. Initialize JSZip
    const zip = new JSZip();

    // 5. Stream each file from Google Drive into the ZIP
    for (const file of files) {
      // Extract just the ID from the Supabase link
      const fileIdMatch = file.download_link?.match(/id=([^&]+)/);
      const fileId = fileIdMatch ? fileIdMatch[1] : null;

      if (fileId) {
        try {
          const driveRes = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' } // Critical: get it as a stream
          );

          // JSZip accepts the Node stream directly!
          zip.file(file.filename, driveRes.data);
        } catch (err) {
          console.error(`Failed to fetch ${file.filename}:`, err.message);
          zip.file(`ERROR_${file.filename}.txt`, `Failed to download. Error: ${err.message}`);
        }
      } else {
        zip.file(`ERROR_${file.filename}.txt`, 'Invalid or missing Drive Link');
      }
    }

    // 6. Generate the Node stream and pipe it to the response
    zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
      .pipe(res)
      .on('finish', () => {
        console.log("ZIP export successfully streamed to client.");
      })
      .on('error', (err) => {
        console.error("Error streaming zip:", err);
      });

  } catch (error) {
    console.error("Archive export error:", error);
    // Only send an error response if we haven't already started streaming the ZIP headers
    if (!res.headersSent) {
      res.status(500).json({ message: error.message || "Server error during export" });
    }
  }
});

// 7. Export Faculty Course Archive as ZIP (using JSZip)
app.post("/api/faculty/export", async (req, res) => {
  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Not authenticated with Google Drive" });

    const drive = google.drive({ version: "v3", auth });
    const { courseId, files } = req.body;

    if (!files || files.length === 0) {
      return res.status(404).json({ message: "No files provided for export." });
    }

    // Set up the ZIP streaming response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="Course_${courseId}.zip"`);

    const zip = new JSZip();

    // Stream each file from Google Drive into the ZIP
    for (const file of files) {
      // Create a neat subfolder structure inside the ZIP (e.g., "Syllabus/file.pdf")
      const zipPath = `${file.folder}/${file.filename}`;

      if (file.fileId) {
        try {
          const driveRes = await drive.files.get(
            { fileId: file.fileId, alt: 'media' },
            { responseType: 'stream' }
          );

          zip.file(zipPath, driveRes.data);
        } catch (err) {
          console.error(`Failed to fetch ${file.filename}:`, err.message);
          // If it fails, leave a helpful text file behind with the web link
          zip.file(`${file.folder}/ERROR_${file.filename}.txt`, `Download failed: ${err.message}\nView manually here: ${file.fallbackLink}`);
        }
      } else {
        zip.file(`${file.folder}/ERROR_${file.filename}.txt`, `Invalid Drive Link.\nView manually here: ${file.fallbackLink}`);
      }
    }

    // Generate the Node stream and pipe it back to the React frontend
    zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
      .pipe(res)
      .on('finish', () => {
        console.log("Faculty ZIP export successfully streamed.");
      })
      .on('error', (err) => {
        console.error("Error streaming zip:", err);
      });

  } catch (error) {
    console.error("Faculty export error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message || "Server error during export" });
    }
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});