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

// ─────────────────────────────────────────────────────────────
// REPORTS API ENDPOINTS
// ─────────────────────────────────────────────────────────────

// Middleware to verify user has reports access
async function verifyReportsAccess(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing authorization header" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    // Verify token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch user role from user_rbac
    const { data: userData, error: roleError } = await supabase
      .from("user_rbac")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (roleError || !userData) {
      return res.status(403).json({ error: "User role not found" });
    }

    // Check if user has any of the coordinator/admin roles
    const isAdmin = userData.thesis === true && userData.thesis_role === "admin";
    const isOJTCoordinator = userData.ojt === true && userData.ojt_role === "coordinator";
    const isResearchCoordinator = userData.similarity === true && userData.similarity_role === "coordinator";

    if (!isAdmin && !isOJTCoordinator && !isResearchCoordinator) {
      return res.status(403).json({ error: "Access denied. Insufficient permissions for reports." });
    }

    // Attach user info to request
    req.user = user;
    req.userRole = userData;
    next();
  } catch (error) {
    console.error("Error in verifyReportsAccess:", error);
    res.status(500).json({ error: "Server error during authorization" });
  }
}

// 8. GET Thesis Archive Reports
app.get("/api/reports/thesis", verifyReportsAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, fullDataset = false, dateFrom, dateTo, department, category } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build query based on available columns in digital_repository table
    let query = supabase
      .from("digital_repository")
      .select("*", { count: "exact" });

    // Apply filters
    if (dateFrom) {
      query = query.gte("date_added", dateFrom);
    }
    if (dateTo) {
      query = query.lte("date_added", dateTo);
    }
    if (department && department !== "All") {
      query = query.eq("department", department);
    }
    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    // If fullDataset is true, return all records without pagination for export
    if (fullDataset === "true") {
      const { data: allData, error } = await query;
      if (error) throw error;

      // Get summary by year and category
      const submissionSummary = {};
      allData.forEach(record => {
        const year = new Date(record.date_added).getFullYear();
        const cat = record.category || "Other";
        const key = `${year}_${cat}`;
        if (!submissionSummary[key]) {
          submissionSummary[key] = { year, category: cat, count: 0 };
        }
        submissionSummary[key].count++;
      });

      return res.json({
        archiveInventory: allData,
        submissionSummary: Object.values(submissionSummary),
      });
    }

    // Otherwise, apply pagination
    const { data: paginatedData, error: dataError, count } = await query
      .range(offset, offset + limitNum - 1);

    if (dataError) throw dataError;

    // Get summary for display
    const { data: allForSummary, error: summaryError } = await supabase
      .from("digital_repository")
      .select("date_added, category");

    if (summaryError) throw summaryError;

    const submissionSummary = {};
    allForSummary.forEach(record => {
      const year = new Date(record.date_added).getFullYear();
      const cat = record.category || "Other";
      const key = `${year}_${cat}`;
      if (!submissionSummary[key]) {
        submissionSummary[key] = { year, category: cat, count: 0 };
      }
      submissionSummary[key].count++;
    });

    res.json({
      archiveInventory: paginatedData,
      submissionSummary: Object.values(submissionSummary),
      totalCount: count,
      page: pageNum,
      limit: limitNum,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching thesis reports:", error);
    res.status(500).json({ error: error.message || "Server error fetching thesis reports" });
  }
});

// 9. GET Similarity Reports
app.get("/api/reports/similarity", verifyReportsAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, fullDataset = false, dateFrom, dateTo, department, category } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build query for plagiarism_reports or similarity_checks table
    let query = supabase
      .from("plagiarism_reports")
      .select("*", { count: "exact" })
      .eq("status", "flagged");

    // Apply filters
    if (dateFrom) {
      query = query.gte("submission_date", dateFrom);
    }
    if (dateTo) {
      query = query.lte("submission_date", dateTo);
    }
    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    // If fullDataset is true, return all records for export
    if (fullDataset === "true") {
      const { data: allData, error } = await query;
      if (error) throw error;

      // Get distribution by category
      const similarityDistribution = {};
      allData.forEach(record => {
        const cat = record.category || "Other";
        if (!similarityDistribution[cat]) {
          similarityDistribution[cat] = { category: cat, scores: [], avgSimilarity: 0 };
        }
        similarityDistribution[cat].scores.push(record.similarity_score || 0);
      });

      // Calculate averages
      Object.values(similarityDistribution).forEach(item => {
        if (item.scores.length > 0) {
          item.avgSimilarity = (item.scores.reduce((a, b) => a + b, 0) / item.scores.length).toFixed(1);
        }
        delete item.scores;
      });

      return res.json({
        flaggedSubmissions: allData,
        similarityDistribution: Object.values(similarityDistribution),
      });
    }

    // Apply pagination
    const { data: paginatedData, error: dataError, count } = await query
      .range(offset, offset + limitNum - 1);

    if (dataError) throw dataError;

    // Get distribution summary
    const { data: allForDistribution, error: distError } = await supabase
      .from("plagiarism_reports")
      .select("category, similarity_score")
      .eq("status", "flagged");

    if (distError) throw distError;

    const similarityDistribution = {};
    allForDistribution.forEach(record => {
      const cat = record.category || "Other";
      if (!similarityDistribution[cat]) {
        similarityDistribution[cat] = { category: cat, scores: [], avgSimilarity: 0 };
      }
      similarityDistribution[cat].scores.push(record.similarity_score || 0);
    });

    // Calculate averages
    Object.values(similarityDistribution).forEach(item => {
      if (item.scores.length > 0) {
        item.avgSimilarity = (item.scores.reduce((a, b) => a + b, 0) / item.scores.length).toFixed(1);
      }
      delete item.scores;
    });

    res.json({
      flaggedSubmissions: paginatedData,
      similarityDistribution: Object.values(similarityDistribution),
      totalCount: count,
      page: pageNum,
      limit: limitNum,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching similarity reports:", error);
    res.status(500).json({ error: error.message || "Server error fetching similarity reports" });
  }
});

// 10. GET OJT/HTE Reports
app.get("/api/reports/ojt", verifyReportsAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, fullDataset = false, dateFrom, dateTo, coordinator, completionStatus } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build query
    let query = supabase
      .from("hte_archive")
      .select("*", { count: "exact" });

    // Apply filters
    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", dateTo);
    }
    if (coordinator && coordinator !== "All") {
      query = query.eq("assigned_coordinator", coordinator);
    }
    if (completionStatus && completionStatus !== "All") {
      query = query.eq("overall_status", completionStatus);
    }

    // If fullDataset is true, return all records for export
    if (fullDataset === "true") {
      const { data: allData, error } = await query;
      if (error) throw error;
      return res.json({ traineeStatus: allData });
    }

    // Apply pagination
    const { data: paginatedData, error: dataError, count } = await query
      .range(offset, offset + limitNum - 1);

    if (dataError) throw dataError;

    // Calculate stats from all data
    const { data: allData, error: statsError } = await supabase
      .from("hte_archive")
      .select("overall_status");

    if (statsError) throw statsError;

    const total = allData.length;
    const complete = allData.filter(t => t.overall_status === "Complete").length;
    const incomplete = total - complete;
    const rate = ((complete / total) * 100).toFixed(1);

    res.json({
      traineeStatus: paginatedData,
      stats: { total, complete, incomplete, rate },
      totalCount: count,
      page: pageNum,
      limit: limitNum,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching OJT reports:", error);
    res.status(500).json({ error: error.message || "Server error fetching OJT reports" });
  }
});

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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});