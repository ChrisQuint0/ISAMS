import express from "express";
import cors from "cors";
import multer from "multer";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import Tesseract from "tesseract.js";
import JSZip from "jszip";
import { Readable } from "stream";
import { createRequire } from "module";

// Load CJS-only packages safely from an ESM context
const require = createRequire(import.meta.url);
const natural = require("natural");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

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
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_DRIVE_FOLDER_ID = process.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Client (Initialize conditionally to prevent app crash if keys are missing)
const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  : null;

// OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// --- Routes ---

// 0. Add User (Admin)
app.post("/api/users", async (req, res) => {
  const { module, firstName, lastName, email, password, role } = req.body;

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY" });
  }

  try {
    // 1. Create user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    // 2. Prepare user_rbac data
    const rbacData = {
      user_id: userId,
      thesis: module === "thesis",
      thesis_role: module === "thesis" ? role : null,
      facsub: module === "facsub",
      facsub_role: module === "facsub" ? role : null,
      labman: module === "labman",
      labman_role: module === "labman" ? role : null,
      studvio: module === "studvio",
      studvio_role: module === "studvio" ? role : null,
      status: "active",
      superadmin: false,
    };

    // Because there may be a Supabase Database Trigger automatically creating a default row 
    // in `user_rbac` on `auth.users` insertion, we first try to Update the existing row.
    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from("user_rbac")
      .update({
        thesis: rbacData.thesis,
        thesis_role: rbacData.thesis_role,
        facsub: rbacData.facsub,
        facsub_role: rbacData.facsub_role,
        labman: rbacData.labman,
        labman_role: rbacData.labman_role,
        studvio: rbacData.studvio,
        studvio_role: rbacData.studvio_role,
      })
      .eq("user_id", userId)
      .select();

    if (updateError) throw updateError;

    // If update affected 0 rows (meaning no trigger exists), we perform a regular insert
    if (!updatedRows || updatedRows.length === 0) {
      const { error: insertError } = await supabaseAdmin.from("user_rbac").insert(rbacData);
      if (insertError) throw insertError;
    } else if (updatedRows.length > 1) {
      // If there are multiple roles (like the bug you experienced), clean up duplicates
      // Keep the first one and delete the rest
      const [firstRow, ...duplicates] = updatedRows;
      const duplicateIds = duplicates.map(row => row.id);
      if (duplicateIds.length > 0) {
        await supabaseAdmin.from("user_rbac").delete().in("id", duplicateIds);
      }
    }

    res.json({ message: "User created successfully", user: authData.user });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: error.message });
  }
});

// 0.1. Update User (Admin)
app.patch("/api/users/:id", async (req, res) => {
  const { id: userId } = req.params;
  const updates = req.body;

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY" });
  }

  try {
    // 1. Update auth.users metadata if needed
    const authUpdatePayload = {};
    if (updates.first_name || updates.last_name) {
      authUpdatePayload.user_metadata = {};
      if (updates.first_name) authUpdatePayload.user_metadata.first_name = updates.first_name;
      if (updates.last_name) authUpdatePayload.user_metadata.last_name = updates.last_name;
    }
    if (updates.email) {
      authUpdatePayload.email = updates.email;
    }

    if (Object.keys(authUpdatePayload).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        authUpdatePayload
      );
      if (authError) throw authError;
    }

    // 2. Update the user_rbac table if needed
    const rbacUpdatePayload = {};
    const rbacFields = [
      'status', 'thesis', 'thesis_role', 'facsub', 'facsub_role',
      'labman', 'labman_role', 'studvio', 'studvio_role'
    ];
    rbacFields.forEach(field => {
      if (updates[field] !== undefined) {
        rbacUpdatePayload[field] = updates[field];
      }
    });

    if (Object.keys(rbacUpdatePayload).length > 0) {
      const { error: rbacError } = await supabaseAdmin
        .from("user_rbac")
        .update(rbacUpdatePayload)
        .eq("user_id", userId);
      if (rbacError) throw rbacError;
    }

    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: error.message });
  }
});

// 0.2. Reset User Password (Admin)
app.post("/api/users/:id/reset-password", async (req, res) => {
  const { id: userId } = req.params;
  const { password } = req.body;

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY" });
  }

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: password }
    );

    if (error) throw error;

    res.json({ message: "Password updated successfully", user: data.user });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: error.message });
  }
});

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
    const fileName = req.file.originalname;

    // 1. Check if a file with the same name already exists in this folder
    const query = `name='${fileName.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed=false`;
    const { data: existingFiles } = await drive.files.list({
      q: query,
      fields: "files(id, name)",
      pageSize: 1,
    });

    // 2. If it exists, permanently delete it before uploading the new one
    if (existingFiles.files && existingFiles.files.length > 0) {
      console.log(`[GDrive] Found existing file "${fileName}", deleting ID: ${existingFiles.files[0].id} for overwrite.`);
      await drive.files.delete({
        fileId: existingFiles.files[0].id,
      });
    }

    const fileMetadata = {
      name: fileName,
      parents: [folderId], // Upload to specific folder
    };
    const media = {
      mimeType: req.file.mimetype,
      body: Readable.from(req.file.buffer),
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, name, webViewLink, webContentLink",
    });

    res.json(file.data);
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: error.message });
  }
});

/// 4.1 Local OCR Validation (Split-Load Architecture Fallback)
app.post("/api/validate-image", upload.array("files"), async (req, res) => {
  try {
    const { doc_type_id } = req.body;
    const files = req.files; // Now correctly handles the array!

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No image file provided" });
    }
    if (!doc_type_id) {
      return res.status(400).json({ error: "Missing doc_type_id" });
    }

    let extractedText = "";
    let processedFiles = [];

    // 1. Run Tesseract OCR on each file directly from RAM (Buffer)
    for (const file of files) {
      processedFiles.push(file.originalname);
      console.log(`[OCR] Starting local OCR for: ${file.originalname}`);

      try {
        const worker = await Tesseract.createWorker('eng');
        await worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
        });
        const { data: { text } } = await worker.recognize(file.buffer);
        await worker.terminate();

        extractedText += text + "\n\n";
      } catch (ocrErr) {
        console.error("[OCR ERROR] Tesseract failed on", file.originalname, ocrErr);
        throw new Error(`Tesseract OCR failed: ${ocrErr.message}`);
      }
    }

    const normalizedText = extractedText.toLowerCase();

    // 2. Fetch Rules from Supabase
    const { data: docType, error: docError } = await supabaseAdmin
      .from('documenttypes_fs')
      .select('required_keywords, forbidden_keywords, max_file_size_mb')
      .eq('doc_type_id', doc_type_id)
      .single();

    if (docError || !docType) throw new Error("Validation rules not found in Supabase");

    const wordCount = extractedText.trim().split(/\s+/).filter(w => w.length > 0).length;

    // 3. Run Validation
    const missingKeywords = [];
    const foundForbidden = [];

    const noSpaceText = normalizedText.replace(/\s+/g, '');

    if (docType.required_keywords && Array.isArray(docType.required_keywords)) {
      for (const keyword of docType.required_keywords) {
        const kwLower = keyword.toLowerCase();
        const kwNoSpace = kwLower.replace(/\s+/g, '');
        if (!normalizedText.includes(kwLower) && !noSpaceText.includes(kwNoSpace)) {
          missingKeywords.push(keyword);
        }
      }
    }
    if (docType.forbidden_keywords && Array.isArray(docType.forbidden_keywords)) {
      for (const keyword of docType.forbidden_keywords) {
        const kwLower = keyword.toLowerCase();
        const kwNoSpace = kwLower.replace(/\s+/g, '');
        if (normalizedText.includes(kwLower) || noSpaceText.includes(kwNoSpace)) {
          foundForbidden.push(keyword);
        }
      }
    }

    // 4. Check if it passes
    let pass = missingKeywords.length === 0 && foundForbidden.length === 0;
    let error = null;

    res.json({
      pass,
      error,
      extractedLength: extractedText.length,
      extractedText: extractedText.trim(),
      wordCount: wordCount,
      missingKeywords,
      foundForbidden,
      analyzedExtension: files.length > 1 ? 'batch_image' : files[0].originalname.substring(files[0].originalname.lastIndexOf('.')),
      processedFiles
    });

  } catch (error) {
    console.error("[OCR] Full fallback error:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// --- Helper: Sanitize folder name for Google Drive ---
function sanitizeFolderName(name) {
  if (!name) return 'Untitled';
  // Strip characters illegal in Drive folder names: / \ : * ? " < > |
  return name.replace(/[\/\\:*?"<>|]/g, '').replace(/\s+/g, ' ').trim() || 'Untitled';
}

// --- Helper: Find or Create a folder inside a parent ---
async function getOrCreateFolder(drive, folderName, parentId) {
  const safeName = sanitizeFolderName(folderName);

  // 1. Search for an existing folder with this exact name inside the parent
  const query = `name='${safeName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;

  const { data } = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    pageSize: 1,
  });

  if (data.files && data.files.length > 0) {
    // Folder already exists — reuse it
    return data.files[0].id;
  }

  // 2. Folder does not exist — create it
  try {
    const createRes = await drive.files.create({
      resource: {
        name: safeName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id',
    });
    return createRes.data.id;
  } catch (err) {
    console.error(`[GDrive] Failed to create folder "${safeName}" in parent "${parentId}":`, err.message);
    throw err;
  }
}

// --- Helper: Format course folder name ---
function formatCourseFolderName(courseCode, section) {
  const safeCode = sanitizeFolderName(courseCode || 'UNKNOWN');
  if (!section) return safeCode;
  const safeSection = sanitizeFolderName(section);
  return `${safeCode} - ${safeSection}`;
}

// 4.5 Ensure Deep-Nest Folder Structure Endpoint
// Hierarchy: Root > Academic Year > Semester > Faculty Name > [CourseCode] - [Section] > Document Type
app.post("/api/folders/ensure", async (req, res) => {
  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Not authenticated" });

    const drive = google.drive({ version: "v3", auth });

    const {
      rootFolderId: bodyRootId,
      academicYear,
      semester,
      facultyName,
      courseCode,
      section,
      docTypeName,
      // Legacy compatibility: also accept the old 2-level params
      termName,
    } = req.body;

    let targetFolderId = bodyRootId || GOOGLE_DRIVE_FOLDER_ID;

    if (!targetFolderId) {
      return res.status(400).json({ error: "rootFolderId is required" });
    }

    // --- Deep-nest mode (new 6-level) ---
    if (academicYear) {
      targetFolderId = await getOrCreateFolder(drive, academicYear, targetFolderId);
    }

    if (semester) {
      targetFolderId = await getOrCreateFolder(drive, semester, targetFolderId);
    }

    if (facultyName) {
      targetFolderId = await getOrCreateFolder(drive, facultyName, targetFolderId);
    }

    if (courseCode) {
      const courseFolderName = formatCourseFolderName(courseCode, section);
      targetFolderId = await getOrCreateFolder(drive, courseFolderName, targetFolderId);
    }

    if (docTypeName) {
      targetFolderId = await getOrCreateFolder(drive, docTypeName, targetFolderId);
    }

    if (!academicYear && termName) {
      targetFolderId = await getOrCreateFolder(drive, termName, targetFolderId);
    }

    res.json({ folderId: targetFolderId });
  } catch (err) {
    console.error("Error ensuring folders:", err);
    res.status(500).json({ error: err.message });
  }
});

// Verifies the main GDrive folder and returns it as the root (no sub-folders created)
app.post("/api/folders/init-isams", async (req, res) => {
  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Not authenticated" });

    const drive = google.drive({ version: "v3", auth });
    const { mainFolderId } = req.body;

    if (!mainFolderId) {
      return res.status(400).json({ error: "mainFolderId is required" });
    }

    // Verify the folder exists and is accessible
    const { data: folder } = await drive.files.get({
      fileId: mainFolderId,
      fields: 'id, name',
    });

    res.json({
      success: true,
      rootId: folder.id,
      mainFolderId
    });
  } catch (err) {
    console.error("Error initializing ISAMS folder:", err);
    res.status(500).json({
      error: err.message,
      detail: err.response?.data?.error || "Check GDrive permissions"
    });
  }
});

// 4.6 Clone File Endpoint
app.post("/api/files/clone", async (req, res) => {
  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Not authenticated" });

    const drive = google.drive({ version: "v3", auth });

    const { fileId, targetFolderId, newFileName } = req.body;

    if (!fileId || !targetFolderId) {
      return res.status(400).json({ error: "fileId and targetFolderId are required" });
    }

    const fileMetadata = {
      parents: [targetFolderId],
    };

    if (newFileName) {
      fileMetadata.name = newFileName;
    }

    // Use Drive API to copy the file on Google's servers
    const file = await drive.files.copy({
      fileId: fileId,
      resource: fileMetadata,
      fields: "id, name, webViewLink, webContentLink",
    });

    res.json(file.data);
  } catch (error) {
    console.error("Error cloning file:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4.7 Move File (For Staging -> Vault)
app.post("/api/files/move", async (req, res) => {
  const { fileId, targetFolderId } = req.body;

  if (!fileId || !targetFolderId) {
    return res.status(400).json({ error: "Missing fileId or targetFolderId" });
  }

  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Not authenticated" });

    const drive = google.drive({ version: "v3", auth });

    // 1. Get current parents
    const file = await drive.files.get({
      fileId: fileId,
      fields: "parents",
    });

    const previousParents = (file.data.parents || []).join(",");

    // 2. Move file: add the new parent and remove all old ones
    const result = await drive.files.update({
      fileId: fileId,
      addParents: targetFolderId,
      removeParents: previousParents,
      fields: "id, parents",
    });

    res.json({ message: "File moved successfully", data: result.data });
  } catch (error) {
    console.error("Error moving file:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4.8 Delete File (For cleanup on rejection)
app.post("/api/files/delete", async (req, res) => {
  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({ error: "Missing fileId" });
  }

  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Not authenticated" });

    const drive = google.drive({ version: "v3", auth });

    // Permanently delete the file
    await drive.files.delete({
      fileId: fileId,
    });

    res.json({ message: "File deleted successfully from GDrive" });
  } catch (error) {
    console.error("Error deleting file:", error);
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

// Removed duplicate deprecated Report endpoints that queried the old digital_repository schema.
// The new definitions are located further down in the file.

// 11. Create HTE Student (Auth + GDrive + DB)
app.post("/api/hte/students/create", async (req, res) => {
  const { studentData, password, academicYear, semester } = req.body;
  const HTE_PARENT_FOLDER_ID = "1AmN8A4Q-D7eUWH7vIE_C_ybV4DWvm99V";

  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Google Drive not authenticated" });
    const drive = google.drive({ version: "v3", auth });

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: studentData.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: studentData.firstName,
        last_name: studentData.lastName,
      },
    });

    if (authError) throw authError;
    const userId = authData.user.id;

    // 2. Set RBAC
    await supabaseAdmin.from("user_rbac").upsert({
      user_id: userId,
      thesis: true, // Thesis Archiving module
      thesis_role: "student",
      status: "active"
    });

    // 3. Create GDrive Folder
    // Pattern: {studentNo}_{lastName}_{semester}
    const folderName = `${studentData.studentId}_${studentData.lastName}_${semester}`;
    const folderId = await getOrCreateFolder(drive, folderName, HTE_PARENT_FOLDER_ID);
    const folderLink = `https://drive.google.com/drive/folders/${folderId}`;

    // 4. Insert Student Record
    const { data: student, error: studentError } = await supabaseAdmin
      .from("hte_ojt_students")
      .insert([{
        user_id: userId,
        student_no: studentData.studentId,
        first_name: studentData.firstName,
        middle_name: studentData.middleName,
        last_name: studentData.lastName,
        email: studentData.email,
        program: studentData.program,
        section: studentData.sectionName || "", // For legacy compatibility
        section_id: studentData.sectionId,
        adviser_id: studentData.adviserId,
        academic_year: academicYear,
        semester: semester,
        gdrive_folder_id: folderId,
        gdrive_folder_link: folderLink,
        overall_status: "incomplete",
        is_active: true
      }])
      .select()
      .single();

    if (studentError) throw studentError;

    res.json({ success: true, student });
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({ error: error.message });
  }
});
// 12. Upload HTE/OJT Document
app.post("/api/hte/upload", upload.single("file"), async (req, res) => {
  const { studentId, fieldId, uploadedByRole } = req.body;
  const file = req.file;

  if (!studentId || !fieldId || !file) {
    return res.status(400).json({ error: "Missing required fields or file" });
  }

  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Google Drive not authenticated" });
    const drive = google.drive({ version: "v3", auth });

    // 1. Find existing upload record
    const { data: existingUpload } = await supabaseAdmin
      .from("hte_document_uploads")
      .select("id, gdrive_file_id")
      .eq("student_id", studentId)
      .eq("field_id", fieldId)
      .maybeSingle();

    // 2. If exists, delete old file from GDrive
    if (existingUpload && existingUpload.gdrive_file_id) {
      try {
        await drive.files.delete({ fileId: existingUpload.gdrive_file_id });
      } catch (delErr) {
        console.warn(`Failed to delete old file (${existingUpload.gdrive_file_id}) from GDrive during overwrite.`, delErr.message);
      }
    }

    // 3. Get student's GDrive folder ID
    const { data: student, error: studentError } = await supabaseAdmin
      .from("hte_ojt_students")
      .select("gdrive_folder_id")
      .eq("id", studentId)
      .single();

    if (studentError || !student) {
      throw new Error("Student not found or missing GDrive folder");
    }

    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      return res.status(400).json({ error: "File exceeds 10MB limit" });
    }

    // 4. Upload new file to GDrive
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${timestamp}-${file.originalname}`;

    const fileMetadata = {
      name: fileName,
      parents: [student.gdrive_folder_id],
    };
    const media = {
      mimeType: file.mimetype,
      body: Readable.from(file.buffer),
    };

    const gdriveRes = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, webViewLink, name",
    });

    const gdriveFileId = gdriveRes.data.id;
    const gdriveViewLink = gdriveRes.data.webViewLink;

    let dbError2;
    let finalUploadData;

    const payload = {
      student_id: studentId,
      field_id: fieldId,
      status: "uploaded",
      original_filename: file.originalname,
      gdrive_file_id: gdriveFileId,
      gdrive_view_link: gdriveViewLink,
      file_size_bytes: file.size,
      uploaded_by_role: uploadedByRole || 'student',
      uploaded_at: new Date().toISOString()
    };

    if (existingUpload) {
      payload.updated_at = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from("hte_document_uploads")
        .update(payload)
        .eq("id", existingUpload.id)
        .select()
        .single();
      dbError2 = error;
      finalUploadData = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("hte_document_uploads")
        .insert([payload])
        .select()
        .single();
      dbError2 = error;
      finalUploadData = data;
    }

    if (dbError2) throw dbError2;

    res.json({ success: true, upload: finalUploadData });

  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ error: error.message });
  }
});

// 13. Delete HTE/OJT Document
app.post("/api/hte/delete", async (req, res) => {
  const { studentId, fieldId } = req.body;
  if (!studentId || !fieldId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Google Drive not authenticated" });
    const drive = google.drive({ version: "v3", auth });

    // 1. Find existing upload record
    const { data: existingUpload, error: fetchErr } = await supabaseAdmin
      .from("hte_document_uploads")
      .select("id, gdrive_file_id")
      .eq("student_id", studentId)
      .eq("field_id", fieldId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (existingUpload) {
      // 2. Delete from GDrive
      if (existingUpload.gdrive_file_id) {
        try {
          await drive.files.delete({ fileId: existingUpload.gdrive_file_id });
        } catch (delErr) {
          console.warn(`Failed to delete file (${existingUpload.gdrive_file_id}) from GDrive during removal.`, delErr.message);
        }
      }

      // 3. Delete from database
      const { error: dbDelErr } = await supabaseAdmin
        .from("hte_document_uploads")
        .delete()
        .eq("id", existingUpload.id);

      if (dbDelErr) throw dbDelErr;
    }

    res.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: error.message });
  }
});

// ── SIMILARITY CHECK ──────────────────────────────────────────────────────────

// S0. Get similarity threshold
app.get("/api/similarity/threshold", async (req, res) => {
  const client = supabaseAdmin || supabase;
  try {
    const { data, error } = await client
      .from("thesis_settings")
      .select("value")
      .eq("key", "similarity_threshold")
      .single();
    if (error) throw error;
    res.json({ value: parseFloat(data?.value ?? "20") });
  } catch (err) {
    // Return default if not found
    res.json({ value: 20 });
  }
});

// S0. Save similarity threshold (uses supabaseAdmin to bypass RLS)
app.post("/api/similarity/threshold", async (req, res) => {
  const { value, updatedBy } = req.body;
  if (value === undefined || value === null) {
    return res.status(400).json({ error: "value is required" });
  }
  const client = supabaseAdmin || supabase;
  try {
    const { error } = await client
      .from("thesis_settings")
      .update({ value: String(value), updated_by: updatedBy || null, updated_at: new Date().toISOString() })
      .eq("key", "similarity_threshold");
    if (error) throw error;
    res.json({ success: true, value });
  } catch (err) {
    console.error("[Similarity Threshold] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// S0b. Create a scan job (uses supabaseAdmin to bypass RLS on insert)
app.post("/api/similarity/job", async (req, res) => {
  const { userId, proposedTitle, fileName, fileSize, mimeType, scanType = "standard" } = req.body;
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const client = supabaseAdmin || supabase;
  try {
    // Get current threshold
    const { data: settingRow } = await client
      .from("thesis_settings")
      .select("value")
      .eq("key", "similarity_threshold")
      .single();
    const threshold = parseFloat(settingRow?.value ?? "20");

    const { data, error } = await client
      .from("similarity_scan_queue")
      .insert({
        submitted_by: userId,
        proposed_title: proposedTitle || null,
        original_filename: fileName,
        file_size_bytes: fileSize || null,
        mime_type: mimeType || null,
        scan_type: scanType,
        threshold_at_scan: threshold,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw error;
    res.json({ scanId: data.id });
  } catch (err) {
    console.error("[Similarity Job] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// S0c. Fetch recent scans for a user (uses supabaseAdmin to bypass RLS)
app.get("/api/similarity/recent/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const client = supabaseAdmin || supabase;
  try {
    const { data, error } = await client
      .from("similarity_scan_queue")
      .select(`
        id, proposed_title, original_filename, status, submitted_at,
        result:similarity_scan_results(overall_score, integrity_status, top_match_title)
      `)
      .eq("submitted_by", userId)
      .order("submitted_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error("[Similarity Recent] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// S0d. Fetch full scan result for PDF export (uses supabaseAdmin to bypass RLS)
app.get("/api/similarity/result/:scanId", async (req, res) => {
  const { scanId } = req.params;
  if (!scanId) return res.status(400).json({ error: "scanId is required" });

  const client = supabaseAdmin || supabase;
  try {
    const { data: queueRow, error: qErr } = await client
      .from("similarity_scan_queue")
      .select("*")
      .eq("id", scanId)
      .single();
    if (qErr) throw qErr;

    const { data: result, error: rErr } = await client
      .from("similarity_scan_results")
      .select("*, field_scores:similarity_scan_field_scores(*), top_matches:similarity_scan_matches(*)")
      .eq("scan_id", scanId)
      .single();
    if (rErr && rErr.code !== "PGRST116") throw rErr;

    res.json({ queue: queueRow, result });
  } catch (err) {
    console.error("[Similarity Result] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Helper: compute TF-IDF cosine similarity between two texts
function cosineSimilarity(textA, textB) {
  const strA = String(textA || "");
  const strB = String(textB || "");
  if (!strA || !strB) return 0;

  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();
  tfidf.addDocument(strA);
  tfidf.addDocument(strB);

  const vecA = {};
  const vecB = {};
  const terms = new Set();

  // listTerms(0) gets the TF-IDF vector for strA
  tfidf.listTerms(0).forEach(item => {
    terms.add(item.term);
    vecA[item.term] = item.tfidf;
  });
  // listTerms(1) gets the TF-IDF vector for strB
  tfidf.listTerms(1).forEach(item => {
    terms.add(item.term);
    vecB[item.term] = item.tfidf;
  });

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const t of terms) {
    const valA = vecA[t] || 0;
    const valB = vecB[t] || 0;
    dot += valA * valB;
    magA += valA * valA;
    magB += valB * valB;
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) return 0;
  return Math.min(100, (dot / (magA * magB)) * 100);
}

// Helper: simple field extraction from raw text
function extractFields(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  let title = '';
  let abstract = '';
  let keywords = '';
  let content = rawText;

  // Heuristic: first non-empty line is likely the title
  if (lines.length > 0) title = lines[0];

  // Look for ABSTRACT section
  const abstractMatch = rawText.match(/abstract[:\s]*\n([\s\S]{50,1500}?)(?=\n[A-Z\s]{3,}:|keywords?:|introduction|$)/i);
  if (abstractMatch) abstract = abstractMatch[1].trim();

  // Look for KEYWORDS section
  const kwMatch = rawText.match(/keywords?[:\s]+([^\n]{10,300})/i);
  if (kwMatch) keywords = kwMatch[1].trim();

  return { title, abstract, keywords, content };
}

// S1. Extract text from uploaded file (PDF / DOCX / DOC)
app.post("/api/similarity/extract", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const { mimetype, buffer, originalname } = req.file;
    let rawText = "";

    if (mimetype === "application/pdf") {
      const result = await pdfParse(buffer);
      rawText = result.text;
    } else if (
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      originalname.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
    } else if (originalname.endsWith(".doc")) {
      // Fallback: try mammoth (works for some older .doc files)
      try {
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value;
      } catch {
        return res.status(422).json({ error: "Legacy .doc format not fully supported. Please convert to .docx or .pdf." });
      }
    } else {
      return res.status(422).json({ error: "Unsupported file type" });
    }

    if (!rawText || rawText.trim().length < 50) {
      return res.status(422).json({ error: "Could not extract sufficient text from the file. Please ensure the document contains selectable text (not scanned images)." });
    }

    const fields = extractFields(rawText);
    res.json({ rawText, ...fields });
  } catch (err) {
    console.error("[Similarity Extract] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// S2. Run NLP similarity analysis against the thesis repository
app.post("/api/similarity/analyze", async (req, res) => {
  const {
    scanId, userId,
    title, abstract, keywords, content,
    fileName, fileSize, mimeType,
    scanType = "standard"
  } = req.body;

  if (!scanId || !userId) {
    return res.status(400).json({ error: "scanId and userId are required" });
  }

  const client = supabaseAdmin || supabase;
  if (!client) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const startTime = Date.now();

  try {
    // 1. Mark job as processing
    await client.from("similarity_scan_queue").update({ status: "processing" }).eq("id", scanId);

    // 2. Fetch active threshold
    const { data: settingRow } = await client
      .from("thesis_settings")
      .select("value")
      .eq("key", "similarity_threshold")
      .single();
    const threshold = parseFloat(settingRow?.value ?? "20");

    // 3. Fetch all thesis entries (title, abstract, description as keywords)
    const { data: theses, error: thesisError } = await client
      .from("thesis_entries")
      .select(`
        id, title, abstract, description,
        publication_year,
        authors:thesis_authors(first_name, last_name)
      `)
      .eq("is_deleted", false)
      .eq("status", "archived");

    if (thesisError) throw thesisError;

    const repositorySize = theses?.length ?? 0;

    // 4. Compute per-thesis cosine similarity scores
    const fullDocText = [title, abstract, keywords, content].filter(Boolean).join(" \n ");
    const scoredTheses = (theses || []).map(thesis => {
      const thesisText = [thesis.title, thesis.abstract, thesis.description].filter(Boolean).join(" ");
      const titleScore = cosineSimilarity(title || "", thesis.title || "");
      const abstractScore = cosineSimilarity(abstract || "", thesis.abstract || "");
      const kwScore = cosineSimilarity(keywords || "", thesis.description || "");
      const contentScore = cosineSimilarity(fullDocText, thesisText);

      // Weighted overall: 25% title, 35% abstract, 20% keywords, 20% content
      const weighted = titleScore * 0.25 + abstractScore * 0.35 + kwScore * 0.20 + contentScore * 0.20;

      const matchedFields = [];
      if (abstractScore > threshold) matchedFields.push("Abstract");
      if (titleScore > threshold) matchedFields.push("Title");
      if (kwScore > threshold) matchedFields.push("Keywords");

      return {
        thesis,
        titleScore,
        abstractScore,
        kwScore,
        contentScore,
        weighted,
        matchType: matchedFields.length > 0 ? matchedFields.join(" & ") : "Content",
      };
    });

    // Sort descending, take top 10
    scoredTheses.sort((a, b) => b.weighted - a.weighted);
    const topMatches = scoredTheses.slice(0, 10);

    // 5. Compute aggregate field scores (avg across all theses, weighted by top matches)
    const topN = Math.min(10, scoredTheses.length);
    const avgField = (field) => topN === 0 ? 0 : scoredTheses.slice(0, topN).reduce((s, t) => s + t[field], 0) / topN;
    const overallScore = topN === 0 ? 0 : avgField("weighted");

    // Final overall = highest single match influences more
    const topMatchScore = topMatches[0]?.weighted ?? 0;
    // Blend: 60% top match, 40% average of top 10
    const finalScore = parseFloat(Math.min(99.99, topMatchScore * 0.6 + overallScore * 0.4).toFixed(2));
    const fieldTitle = parseFloat((topMatches[0]?.titleScore ?? 0).toFixed(2));
    const fieldAbstract = parseFloat((topMatches[0]?.abstractScore ?? 0).toFixed(2));
    const fieldKeywords = parseFloat((topMatches[0]?.kwScore ?? 0).toFixed(2));
    const fieldContent = parseFloat((topMatches[0]?.contentScore ?? 0).toFixed(2));

    const durationMs = Date.now() - startTime;

    // 6. Update scan queue with metadata
    await client.from("similarity_scan_queue").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      repository_size_at_scan: repositorySize,
      analysis_duration_ms: durationMs,
      engine_version: "ISAMS-NLP v1.0",
      threshold_at_scan: threshold,
    }).eq("id", scanId);

    // 7. Insert scan result (triggers DB trigger for integrity_status derivation)
    const topMatchEntry = topMatches[0];
    const { data: resultRow, error: resultErr } = await client
      .from("similarity_scan_results")
      .insert({
        scan_id: scanId,
        overall_score: finalScore,
        integrity_status: finalScore > 50 ? "high_similarity" : finalScore > threshold ? "flagged" : "safe",
        analysis_method: "TF-IDF Cosine Similarity",
        top_match_score: parseFloat((topMatchEntry?.weighted ?? 0).toFixed(2)),
        top_match_title: topMatchEntry?.thesis?.title ?? null,
      })
      .select()
      .single();

    if (resultErr) throw resultErr;
    const resultId = resultRow.id;

    // 8. Insert field scores
    const getSeverity = (score) => score > 50 ? "high" : score > threshold ? "moderate" : "low";
    await client.from("similarity_scan_field_scores").insert([
      { result_id: resultId, field_name: "title", score: fieldTitle, severity: getSeverity(fieldTitle), display_label: "Title match", display_order: 1 },
      { result_id: resultId, field_name: "abstract", score: fieldAbstract, severity: getSeverity(fieldAbstract), display_label: "Abstract match", display_order: 2 },
      { result_id: resultId, field_name: "content", score: fieldContent, severity: getSeverity(fieldContent), display_label: "Content match", display_order: 3 },
      { result_id: resultId, field_name: "keywords", score: fieldKeywords, severity: getSeverity(fieldKeywords), display_label: "Keywords match", display_order: 4 },
    ]);

    // 9. Insert top match records
    const matchInserts = topMatches
      .filter(m => m.weighted > 1)
      .slice(0, 5)
      .map((m, idx) => ({
        result_id: resultId,
        match_rank: idx + 1,
        matched_thesis_id: m.thesis.id,
        matched_title: m.thesis.title,
        matched_authors: (m.thesis.authors || []).map(a => `${a.first_name} ${a.last_name}`),
        matched_year: m.thesis.publication_year,
        match_score: parseFloat(m.weighted.toFixed(2)),
        match_type: m.matchType,
        match_source: "internal",
      }));

    if (matchInserts.length > 0) {
      await client.from("similarity_scan_matches").insert(matchInserts);
    }

    // 10. Return full result
    const fullResult = {
      scanId,
      resultId,
      overall_score: finalScore,
      integrity_status: resultRow.integrity_status,
      integrity_label: resultRow.integrity_label,
      integrity_detail: resultRow.integrity_detail,
      analysis_method: "TF-IDF Cosine Similarity",
      analysis_duration_ms: durationMs,
      repository_size: repositorySize,
      engine_version: "ISAMS-NLP v1.0",
      threshold,
      field_scores: [
        { field_name: "title", score: fieldTitle, display_label: "Title match", severity: getSeverity(fieldTitle), display_order: 1 },
        { field_name: "abstract", score: fieldAbstract, display_label: "Abstract match", severity: getSeverity(fieldAbstract), display_order: 2 },
        { field_name: "content", score: fieldContent, display_label: "Content match", severity: getSeverity(fieldContent), display_order: 3 },
        { field_name: "keywords", score: fieldKeywords, display_label: "Keywords match", severity: getSeverity(fieldKeywords), display_order: 4 },
      ],
      top_matches: matchInserts,
    };

    res.json(fullResult);
  } catch (err) {
    console.error("[Similarity Analyze] Error:", err);
    // Mark job as failed
    try {
      await client.from("similarity_scan_queue").update({
        status: "failed",
        status_message: err.message,
        completed_at: new Date().toISOString(),
      }).eq("id", scanId);
    } catch (_) { }

    res.status(500).json({ error: err.message });
  }
});

// ── END SIMILARITY CHECK ───────────────────────────────────────────────────────

// ── REPORTS & ANALYTICS ────────────────────────────────────────────────────────

// Helper to get active user from token
async function getUserFromReq(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "No auth token provided" });
    return null;
  }
  const token = authHeader.replace("Bearer ", "");
  const client = supabaseAdmin || supabase;
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: "Invalid auth token" });
    return null;
  }
  return user;
}

// 1. Thesis Reports
app.get("/api/reports/thesis", async (req, res) => {
  const user = await getUserFromReq(req, res);
  if (!user) return;

  const { dateFrom, dateTo, department = "All", category = "All", page = 1, limit = 10, fullDataset = false } = req.query;
  const client = supabaseAdmin || supabase;

  try {
    // THESIS SUMMARY
    let summaryQuery = client.from("vw_report_thesis_summary").select("*");
    if (category !== "All") summaryQuery = summaryQuery.eq("category", category);
    // Removed department filter

    // Aggregate by year and category across departments
    const { data: rawSummary, error: sumErr } = await summaryQuery;
    if (sumErr) throw sumErr;

    // Grouping logic for summary (sum up the counts if multiple departments match)
    const summaryMap = new Map();
    (rawSummary || []).forEach(row => {
      const key = `${row.year}_${row.category}`;
      if (!summaryMap.has(key)) summaryMap.set(key, { year: row.year, category: row.category, count: 0 });
      summaryMap.get(key).count += Number(row.count);
    });
    const submissionSummary = Array.from(summaryMap.values()).sort((a, b) => a.year - b.year || a.category.localeCompare(b.category));

    // ARCHIVE INVENTORY
    let invQuery = client.from("vw_report_archive_inventory").select("*", { count: 'exact' });
    if (category !== "All") invQuery = invQuery.eq("category_name", category);
    if (dateFrom) invQuery = invQuery.gte("date_added", dateFrom);
    if (dateTo) invQuery = invQuery.lte("date_added", dateTo);

    // Pagination (unless fullDataset is true)
    const pageNum = parseInt(page);
    const perPage = parseInt(limit);
    if (fullDataset !== "true") {
      const start = (pageNum - 1) * perPage;
      invQuery = invQuery.range(start, start + perPage - 1);
    }

    invQuery = invQuery.order("date_added", { ascending: false });

    const { data: archiveInventoryRaw, count: totalCount, error: invErr } = await invQuery;
    if (invErr) throw invErr;

    // Format output to match frontend expectation
    const archiveInventory = (archiveInventoryRaw || []).map(row => ({
      id: row.id,
      title: row.title,
      authors: row.authors,
      category: row.category_name, // Return category_name mapped to category for UI
      year: row.publication_year,
      dateAdded: row.date_added
    }));

    res.json({
      submissionSummary,
      archiveInventory,
      totalCount: totalCount || 0,
      page: pageNum,
      totalPages: fullDataset === "true" ? 1 : Math.ceil((totalCount || 0) / perPage)
    });
  } catch (error) {
    console.error("Thesis report error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Similarity Reports
app.get("/api/reports/similarity", async (req, res) => {
  const user = await getUserFromReq(req, res);
  if (!user) return;

  const { dateFrom, dateTo, category = "All", page = 1, limit = 10, fullDataset = false } = req.query;
  const client = supabaseAdmin || supabase;

  try {
    // DISTRIBUTION
    let distQuery = client.from("vw_report_similarity_distribution").select("*");
    const { data: rawDist, error: distErr } = await distQuery;
    if (distErr) throw distErr;

    const similarityDistribution = (rawDist || []).map(row => ({
      category: row.category,
      avgSimilarity: parseFloat(row.avg_similarity) || 0
    }));

    // ALL SUBMISSION CHECKS (Fetching from base tables to ensure "all all all" are included)
    let flagQuery = client
      .from("similarity_scan_queue")
      .select(`
        id,
        title:proposed_title,
        status,
        submission_date:submitted_at,
        thesis_id,
        result:similarity_scan_results(overall_score, integrity_status),
        thesis:thesis_entries(
          category:thesis_categories(name)
        )
      `, { count: 'exact' });

    if (category !== "All") {
      flagQuery = flagQuery.eq("thesis.category.name", category);
    }
    if (dateFrom) flagQuery = flagQuery.gte("submitted_at", dateFrom);
    if (dateTo) flagQuery = flagQuery.lte("submitted_at", dateTo);

    const pageNum = parseInt(page);
    const perPage = parseInt(limit);
    if (fullDataset !== "true") {
      const start = (pageNum - 1) * perPage;
      flagQuery = flagQuery.range(start, start + perPage - 1);
    }

    flagQuery = flagQuery.order("submitted_at", { ascending: false });

    const { data: rawData, count: totalCount, error: flagErr } = await flagQuery;
    if (flagErr) throw flagErr;

    const flaggedSubmissions = (rawData || []).map(row => {
      // result might be an array or single object depending on select
      const resultData = Array.isArray(row.result) ? row.result[0] : row.result;
      const score = resultData?.overall_score || 0;
      const categoryName = row.thesis?.category?.name || "Uncategorized";

      return {
        id: row.id,
        title: row.title || "Untitled Scan",
        category: categoryName,
        submissionDate: row.submission_date ? new Date(row.submission_date).toLocaleDateString() : "N/A",
        similarityScore: parseFloat(score) || 0,
        // Strictly "Flagged" or "Safe".
        reviewStatus: score > 20 ? "Flagged" : "Safe"
      };
    });

    res.json({
      similarityDistribution: [], // kept for backward compatibility if needed, but empty
      flaggedSubmissions,
      totalCount: totalCount || 0,
      page: pageNum,
      totalPages: fullDataset === "true" ? 1 : Math.ceil((totalCount || 0) / perPage)
    });
  } catch (error) {
    console.error("Similarity report error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. OJT Reports
app.get("/api/reports/coordinators", async (req, res) => {
  const client = supabaseAdmin || supabase;
  try {
    const { data, error } = await client
      .from("vw_report_ojt_trainee_status")
      .select("coordinator");

    if (error) throw error;

    // Get unique coordinators, filter out null/empty
    const uniqueCoordinators = [...new Set((data || []).map(r => r.coordinator).filter(Boolean))].sort();

    res.json(uniqueCoordinators);
  } catch (error) {
    console.error("Coordinators fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reports/ojt", async (req, res) => {
  const user = await getUserFromReq(req, res);
  if (!user) return;

  const { department = "All", coordinator = "All", completionStatus = "All", page = 1, limit = 10, fullDataset = false } = req.query;
  const client = supabaseAdmin || supabase;

  try {
    // TRAINEE STATUS
    let ojtQuery = client.from("vw_report_ojt_trainee_status").select("*", { count: 'exact' });

    // Filters
    if (department !== "All") ojtQuery = ojtQuery.eq("department", department);
    if (coordinator !== "All") ojtQuery = ojtQuery.eq("coordinator", coordinator);
    if (completionStatus !== "All" && completionStatus !== "total") {
      ojtQuery = ojtQuery.ilike("overall_status", completionStatus);
    }

    // Also get completion stats without pagination
    let countQuery = client.from("vw_report_ojt_trainee_status").select("overall_status");
    if (department !== "All") countQuery = countQuery.eq("department", department);
    if (coordinator !== "All") countQuery = countQuery.eq("coordinator", coordinator);
    // don't apply completionStatus to overall counts

    const { data: allStats, error: countErr } = await countQuery;
    if (countErr) throw countErr;

    const total = allStats.length;
    const complete = allStats.filter(r => r.overall_status.toLowerCase() === "complete").length;
    const incomplete = total - complete;
    const rate = total > 0 ? ((complete / total) * 100).toFixed(1) : "0.0";

    const pageNum = parseInt(page);
    const perPage = parseInt(limit);
    if (fullDataset !== "true") {
      const start = (pageNum - 1) * perPage;
      ojtQuery = ojtQuery.range(start, start + perPage - 1);
    }

    const { data: traineeRaw, error: ojtErr } = await ojtQuery;
    if (ojtErr) throw ojtErr;

    const traineeStatus = (traineeRaw || []).map(row => ({
      id: row.id,
      studentName: row.student_name,
      studentId: row.student_id,
      academicYear: row.academic_year,
      semester: row.semester,
      coordinator: row.coordinator,
      totalRequired: parseInt(row.total_required) || 0,
      totalUploaded: parseInt(row.total_uploaded) || 0,
      overallStatus: row.overall_status.charAt(0).toUpperCase() + row.overall_status.slice(1)
    }));

    res.json({
      traineeStatus,
      stats: { total, complete, incomplete, rate },
      totalCount: fullDataset === "true" ? traineeStatus.length : (completionStatus === "All" || completionStatus === "total" ? total : (completionStatus.toLowerCase() === "complete" ? complete : incomplete)),
      page: pageNum,
      totalPages: fullDataset === "true" ? 1 : Math.ceil((completionStatus === "All" || completionStatus === "total" ? total : (completionStatus.toLowerCase() === "complete" ? complete : incomplete)) / perPage)
    });
  } catch (error) {
    console.error("OJT report error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ── END REPORTS & ANALYTICS ────────────────────────────────────────────────────

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
