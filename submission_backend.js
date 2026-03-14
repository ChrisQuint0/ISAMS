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
import sgMail from "@sendgrid/mail";

// Load environment variables from .env.local
dotenv.config({ path: "./.env.local" });

const app = express();
const port = 3002; // Dedicated port for Faculty Submissions

// Config
const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.VITE_GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3002/oauth2callback";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_DRIVE_FOLDER_ID = process.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@isams.edu";
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || "ISAMS System";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Middleware
app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[Submission Backend] ${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Supabase Clients
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

// ---------- Email HTML template builder ----------
function buildEmailHtml(template, { facultyName, subject, message, pendingCount, lateCount, courseDetails, docType, filenames }) {
  const primaryColor = "#009845";
  const baseStyle = `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; padding: 32px 16px; margin: 0;`;
  const cardStyle = `background: #ffffff; border-radius: 12px; padding: 32px; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.06);`;
  const headerStr = `
    <div style="border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 24px;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: ${primaryColor};">ISAMS</h1>
      <p style="margin: 4px 0 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8;">Institutional Submission &amp; Monitoring System</p>
    </div>`;
  const footerStr = `
    <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">This is an automated message from ISAMS. Do not reply to this email.</p>
    </div>`;

  const wrap = (body) => `<div style="${baseStyle}"><div style="${cardStyle}">${headerStr}${body}${footerStr}</div></div>`;

  if (template === "deadline_reminder") {
    return {
      subject: subject || "[ISAMS] Submission Reminder — Action Required",
      html: wrap(`
        <p style="font-size: 15px; color: #1e293b; margin: 0 0 12px;">Dear <strong>${facultyName}</strong>,</p>
        ${message ? `
        <div style="background: #f0fdf4; border-left: 4px solid #009845; padding: 14px 16px; border-radius: 4px; margin: 0 0 20px;">
          <p style="margin: 0; font-size: 14px; color: #166534; line-height: 1.7;">${message}</p>
        </div>` : `
        <p style="font-size: 14px; color: #475569; line-height: 1.7;">This is a reminder that you have pending faculty requirement submissions that need your attention.</p>`}
        ${pendingCount ? `
        <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; font-weight: 700; color: #c2410c;">⚠ ${pendingCount} Pending Submission${parseInt(pendingCount) !== 1 ? "s" : ""}</p>
          ${lateCount && parseInt(lateCount) > 0 ? `<p style="margin: 6px 0 0; font-size: 12px; color: #dc2626;">🔴 ${lateCount} item${parseInt(lateCount) !== 1 ? "s" : ""} marked as Late</p>` : ""}
        </div>` : ""}
        <p style="font-size: 14px; color: #475569; line-height: 1.7;">Please log in to the <strong>ISAMS portal</strong> to complete your submissions before the deadline.</p>
      `)
    };
  }

  if (template === "revision_request") {
    return {
      subject: subject || "[ISAMS] Document Revision Required",
      html: wrap(`
        <p style="font-size: 15px; color: #1e293b; margin: 0 0 12px;">Dear <strong>${facultyName}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.7;">The admin has reviewed your submission and is requesting a revision.</p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          ${courseDetails ? `<p style="margin: 0 0 8px; font-size: 13px; color: #475569;"><strong style="color: #1e293b;">Course:</strong> ${courseDetails}</p>` : ""}
          ${docType ? `<p style="margin: 0 0 8px; font-size: 13px; color: #475569;"><strong style="color: #1e293b;">Requirement:</strong> ${docType}</p>` : ""}
          ${filenames ? `<p style="margin: 0; font-size: 13px; color: #475569;"><strong style="color: #1e293b;">Files:</strong> ${filenames}</p>` : ""}
        </div>

        ${message ? `
        <div style="background: #fefce8; border-left: 4px solid #eab308; padding: 16px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #854d0e;">Revision Reason</p>
          <p style="margin: 8px 0 0; font-size: 14px; color: #713f12;">${message}</p>
        </div>` : ""}
        <p style="font-size: 14px; color: #475569;">Please log in to ISAMS, review the feedback, and resubmit your document.</p>
      `)
    };
  }

  if (template === "escalation") {
    return {
      subject: subject || "[ISAMS] URGENT — Overdue Submission",
      html: wrap(`
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 12px; font-weight: 800; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px;">🚨 Urgent Notice</p>
        </div>
        <p style="font-size: 15px; color: #1e293b; margin: 0 0 12px;">Dear <strong>${facultyName}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.7;">${message || "Your submission deadline has passed. Immediate action is required to avoid disciplinary measures."}</p>
        <p style="font-size: 14px; color: #475569;">Please contact the administrator immediately.</p>
      `)
    };
  }

  // Generic
  return {
    subject: subject || "[ISAMS] Notification",
    html: wrap(`<p style="font-size:15px;color:#1e293b;">Dear <strong>${facultyName}</strong>,</p><p style="font-size:14px;color:#475569;">${message || ""}</p>`)
  };
}

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

// 1. Auth URL
app.get("/api/auth", (req, res) => {
  const scopes = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline", 
    scope: scopes,
    prompt: "consent",
  });

  res.json({ url });
});

// 2. OAuth Callback
app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const { error } = await supabase.from("google_auth_tokens").upsert({
      id: 1, 
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
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

// 3. List Files
app.get("/api/files", async (req, res) => {
  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Not authenticated" });

    const drive = google.drive({ version: "v3", auth });
    const folderId = req.query.folderId || GOOGLE_DRIVE_FOLDER_ID;
    const query = `'${folderId}' in parents and trashed=false`;

    const response = await drive.files.list({
      pageSize: 50,
      fields: "nextPageToken, files(id, name, webViewLink, iconLink, createdTime, size, webContentLink)",
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
    const folderId = req.body.folderId || GOOGLE_DRIVE_FOLDER_ID;
    const fileName = req.file.originalname;

    const query = `name='${fileName.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed=false`;
    const { data: existingFiles } = await drive.files.list({
      q: query,
      fields: "files(id, name)",
      pageSize: 1,
    });

    if (existingFiles.files && existingFiles.files.length > 0) {
      console.log(`[GDrive] Found existing file "${fileName}", deleting ID: ${existingFiles.files[0].id} for overwrite.`);
      await drive.files.delete({ fileId: existingFiles.files[0].id });
    }

    const fileMetadata = { name: fileName, parents: [folderId] };
    const media = { mimeType: req.file.mimetype, body: Readable.from(req.file.buffer) };

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

// 4.1 Local OCR Validation
app.post("/api/validate-image", upload.array("files"), async (req, res) => {
  try {
    const { doc_type_id } = req.body;
    const files = req.files;

    if (!files || files.length === 0) return res.status(400).json({ error: "No image file provided" });
    if (!doc_type_id) return res.status(400).json({ error: "Missing doc_type_id" });

    let extractedText = "";
    let processedFiles = [];

    for (const file of files) {
      processedFiles.push(file.originalname);
      try {
        const worker = await Tesseract.createWorker('eng');
        await worker.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT });
        const { data: { text } } = await worker.recognize(file.buffer);
        await worker.terminate();
        extractedText += text + "\n\n";
      } catch (ocrErr) {
        console.error("[OCR ERROR]", file.originalname, ocrErr);
        throw new Error(`Tesseract OCR failed: ${ocrErr.message}`);
      }
    }

    const normalizedText = extractedText.toLowerCase();
    const { data: docType, error: docError } = await supabaseAdmin
      .from('documenttypes_fs')
      .select('required_keywords, forbidden_keywords, max_file_size_mb')
      .eq('doc_type_id', doc_type_id)
      .single();

    if (docError || !docType) throw new Error("Validation rules not found");

    const wordCount = extractedText.trim().split(/\s+/).filter(w => w.length > 0).length;
    const missingKeywords = [];
    const foundForbidden = [];
    const noSpaceText = normalizedText.replace(/\s+/g, '');

    if (docType.required_keywords && Array.isArray(docType.required_keywords)) {
      for (const keyword of docType.required_keywords) {
        const kwNoSpace = keyword.toLowerCase().replace(/\s+/g, '');
        if (!normalizedText.includes(keyword.toLowerCase()) && !noSpaceText.includes(kwNoSpace)) missingKeywords.push(keyword);
      }
    }
    if (docType.forbidden_keywords && Array.isArray(docType.forbidden_keywords)) {
      for (const keyword of docType.forbidden_keywords) {
        const kwNoSpace = keyword.toLowerCase().replace(/\s+/g, '');
        if (normalizedText.includes(keyword.toLowerCase()) || noSpaceText.includes(kwNoSpace)) foundForbidden.push(keyword);
      }
    }

    res.json({
      pass: missingKeywords.length === 0 && foundForbidden.length === 0,
      extractedText: extractedText.trim(),
      wordCount,
      missingKeywords,
      foundForbidden,
      processedFiles
    });
  } catch (error) {
    console.error("[OCR] Full fallback error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Folder Helpers
function sanitizeFolderName(name) {
  if (!name) return 'Untitled';
  return name.replace(/[\/\\:*?"<>|]/g, '').replace(/\s+/g, ' ').trim() || 'Untitled';
}

async function getOrCreateFolder(drive, folderName, parentId) {
  const safeName = sanitizeFolderName(folderName);
  const query = `name='${safeName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;
  const { data } = await drive.files.list({ q: query, fields: 'files(id, name)', pageSize: 1 });
  if (data.files && data.files.length > 0) return data.files[0].id;
  
  const createRes = await drive.files.create({
    resource: { name: safeName, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
    fields: 'id',
  });
  return createRes.data.id;
}

function formatCourseFolderName(courseCode, section) {
  const safeCode = sanitizeFolderName(courseCode || 'UNKNOWN');
  return section ? `${safeCode} - ${sanitizeFolderName(section)}` : safeCode;
}

// 4.5 Ensure Deep-Nest Folder Structure
app.post("/api/folders/ensure", async (req, res) => {
  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Not authenticated" });
    const drive = google.drive({ version: "v3", auth });
    const { rootFolderId: bodyRootId, academicYear, semester, facultyName, courseCode, section, docTypeName, termName } = req.body;
    let targetId = bodyRootId || GOOGLE_DRIVE_FOLDER_ID;

    if (academicYear) targetId = await getOrCreateFolder(drive, academicYear, targetId);
    if (semester) targetId = await getOrCreateFolder(drive, semester, targetId);
    if (facultyName) targetId = await getOrCreateFolder(drive, facultyName, targetId);
    if (courseCode) targetId = await getOrCreateFolder(drive, formatCourseFolderName(courseCode, section), targetId);
    if (docTypeName) targetId = await getOrCreateFolder(drive, docTypeName, targetId);
    if (!academicYear && termName) targetId = await getOrCreateFolder(drive, termName, targetId);

    res.json({ folderId: targetId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/folders/init-isams", async (req, res) => {
  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Not authenticated" });
    const drive = google.drive({ version: "v3", auth });
    const { mainFolderId } = req.body;
    const { data: folder } = await drive.files.get({ fileId: mainFolderId, fields: 'id, name' });
    res.json({ success: true, rootId: folder.id, mainFolderId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// File Clone/Move/Delete
app.post("/api/files/clone", async (req, res) => {
  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Not authenticated" });
    const drive = google.drive({ version: "v3", auth });
    const { fileId, targetFolderId, newFileName } = req.body;
    const fileMetadata = { parents: [targetFolderId] };
    if (newFileName) fileMetadata.name = newFileName;
    const file = await drive.files.copy({ fileId, resource: fileMetadata, fields: "id, name, webViewLink, webContentLink" });
    res.json(file.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/files/move", async (req, res) => {
  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Not authenticated" });
    const drive = google.drive({ version: "v3", auth });
    const { fileId, targetFolderId } = req.body;
    const file = await drive.files.get({ fileId, fields: "parents" });
    const previousParents = (file.data.parents || []).join(",");
    const result = await drive.files.update({ fileId, addParents: targetFolderId, removeParents: previousParents, fields: "id, parents" });
    res.json({ message: "File moved successfully", data: result.data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/files/metadata", async (req, res) => {
  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Not authenticated" });
    const drive = google.drive({ version: "v3", auth });
    const { fileId } = req.query;
    
    const response = await drive.files.get({
      fileId,
      fields: "id, name, webViewLink, iconLink, createdTime, size, mimeType, trashed"
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Error getting file metadata:", error);
    res.status(500).json({ error: error.message });
  }
});


app.post("/api/files/delete", async (req, res) => {
  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Not authenticated" });
    const drive = google.drive({ version: "v3", auth });
    
    // Safety: Move to trash instead of permanent delete
    await drive.files.update({ 
      fileId: req.body.fileId,
      requestBody: { trashed: true },
      supportsAllDrives: true,
      supportsTeamDrives: true
    });
    
    res.json({ message: "File moved to trash successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ZIP Exports
app.post("/api/archive/export", async (req, res) => {
  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Not authenticated" });
    const drive = google.drive({ version: "v3", auth });
    const { semester, academic_year, department } = req.body;
    const p_semester = (semester === 'All Semesters' || semester === 'ALL') ? null : semester;
    const p_academic_year = (academic_year === 'All Years' || academic_year === 'ALL') ? null : academic_year;
    const p_department = (department === 'All Departments' || department === 'ALL') ? null : department;

    const { data: files, error } = await supabase.rpc('get_archive_export_links_fs', { p_semester, p_academic_year, p_department });
    if (error) throw error;
    if (!files || files.length === 0) return res.status(404).json({ message: "No files found" });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="Archive.zip"`);
    const zip = new JSZip();
    for (const file of files) {
      const fileIdMatch = file.download_link?.match(/id=([^&]+)/);
      const fileId = fileIdMatch ? fileIdMatch[1] : null;
      if (fileId) {
        try {
          const driveRes = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
          zip.file(file.filename, driveRes.data);
        } catch (err) {
          zip.file(`ERROR_${file.filename}.txt`, `Failed to download: ${err.message}`);
        }
      }
    }
    zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true }).pipe(res);
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ message: error.message });
  }
});

app.post("/api/faculty/export", async (req, res) => {
  try {
    const auth = await loadToken();
    if (!auth) return res.status(401).json({ error: "Not authenticated" });
    const drive = google.drive({ version: "v3", auth });
    const { courseId, files } = req.body;
    if (!files || files.length === 0) return res.status(404).json({ message: "No files provided" });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="Course_${courseId}.zip"`);
    const zip = new JSZip();
    for (const file of files) {
      const zipPath = `${file.folder}/${file.filename}`;
      if (file.fileId) {
        try {
          const driveRes = await drive.files.get({ fileId: file.fileId, alt: 'media' }, { responseType: 'stream' });
          zip.file(zipPath, driveRes.data);
        } catch (err) {
          zip.file(`${file.folder}/ERROR_${file.filename}.txt`, `Download failed: ${err.message}`);
        }
      }
    }
    zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true }).pipe(res);
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ message: error.message });
  }
});

// Email Notification
app.post("/api/send-email", async (req, res) => {
  if (!SENDGRID_API_KEY || !supabaseAdmin) return res.status(500).json({ error: "Config missing" });
  const { faculty_id, template = "deadline_reminder", subject, message, pending_count, late_count } = req.body;
  if (!faculty_id) return res.status(400).json({ error: "faculty_id is required" });

  try {
    const { data: faculty, error: facultyErr } = await supabaseAdmin.from("faculty_fs").select("first_name, last_name, email, email_reminders_enabled").eq("faculty_id", faculty_id).single();
    if (facultyErr || !faculty || !faculty.email) return res.status(404).json({ error: "Faculty or email not found" });

    // Respect faculty preference
    if (faculty.email_reminders_enabled === false) {
      console.log(`[Submission Backend] Email skipped for ${faculty_id} (${faculty.email}) - Reminders disabled by user.`);
      return res.json({ success: true, ignored: true, message: "Email skipped due to faculty preference" });
    }

    const facultyName = `${faculty.first_name} ${faculty.last_name}`.trim();
    const { subject: builtSubject, html } = buildEmailHtml(template, { 
      facultyName, 
      subject, 
      message, 
      pendingCount: pending_count?.toString(), 
      lateCount: late_count?.toString(),
      courseDetails: req.body.courseDetails,
      docType: req.body.docType,
      filenames: req.body.filenames
    });

    await sgMail.send({ to: { email: faculty.email, name: facultyName }, from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME }, subject: builtSubject, html });

    const notifType = template === "revision_request" ? "REVISION_REQUEST" : "DEADLINE_REMINDER";
    await supabaseAdmin.from("notifications_fs").insert({ faculty_id, notification_type: notifType, subject: builtSubject, message: message || `Email sent to ${faculty.email}`, email_sent_at: new Date().toISOString(), email_recipient: faculty.email });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/status", async (req, res) => {
  const { data } = await supabase.from("google_auth_tokens").select("id").eq("id", 1).single();
  res.json({ authenticated: !!data });
});

app.listen(port, () => {
  console.log(`Submission Backend running at http://localhost:${port}`);
});
