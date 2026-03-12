import express from "express";
import cors from "cors";
import multer from "multer";
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
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Client
const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  : null;

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

    // Log the event
    await logAuditTrail(req, {
      action: "Add",
      description: `Created new user: ${firstName} ${lastName} (${email})`,
      moduleAffected: "Auth",
      recordId: userId,
      newValues: { firstName, lastName, email, role, module },
      actorUserId: req.body.actorUserId || null,
      actorName: req.body.actorName || "Admin"
    });
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

    // Log the event
    await logAuditTrail(req, {
      action: "Edit",
      description: `Updated user profile for: ${updates.email || userId}`,
      moduleAffected: "Auth",
      recordId: userId,
      recordType: "auth.users",
      newValues: updates,
      actorUserId: req.body.actorUserId || null,
      actorName: req.body.actorName || "Admin"
    });
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

    // Log the event
    await logAuditTrail(req, {
      action: "Edit",
      description: `Reset password for user: ${userId}`,
      moduleAffected: "Auth",
      recordId: userId,
      recordType: "auth.users",
      actorUserId: req.body.actorUserId || null,
      actorName: req.body.actorName || "Admin"
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: error.message });
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

    // Log the event
    await logAuditTrail(req, {
      action: "Add",
      description: `Enrolled new HTE student: ${studentData.firstName} ${studentData.lastName} (${studentData.studentId})`,
      moduleAffected: "HTE Archiving",
      recordId: student.id,
      recordType: "hte_ojt_students",
      newValues: student,
      actorUserId: req.body.actorUserId || null,
      actorName: req.body.actorName || "Admin"
    });
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

    // Log the event
    await logAuditTrail(req, {
      action: "Upload",
      description: `Uploaded document: "${file.originalname}" for student ID ${studentId}`,
      moduleAffected: "HTE Archiving",
      recordId: finalUploadData.id,
      recordType: "hte_document_uploads",
      newValues: { fieldId, status: "uploaded" },
      actorUserId: req.body.actorUserId || req.body.userId || null,
      actorName: req.body.actorName || (uploadedByRole === 'student' ? 'Student' : 'Coordinator')
    });

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

    // Log the event
    await logAuditTrail(req, {
      action: "Delete",
      description: `Removed HTE document (Field ID: ${fieldId}) for student ID ${studentId}`,
      moduleAffected: "HTE Archiving",
      recordId: studentId,
      recordType: "hte_ojt_students",
      actorUserId: req.body.actorUserId || null,
      actorName: req.body.actorName || "Coordinator"
    });
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

    // Log the event
    await logAuditTrail(req, {
      action: "Settings",
      description: `Updated similarity threshold to ${value}%`,
      moduleAffected: "Similarity Check",
      recordId: "similarity_threshold",
      recordType: "thesis_settings",
      newValues: { threshold: value },
      actorUserId: req.body.actorUserId || updatedBy || null,
      actorName: req.body.actorName || "Admin"
    });
  } catch (err) {
    console.error("[Similarity Threshold] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// S0c. Mark a scan result as reviewed
app.post("/api/similarity/review", async (req, res) => {
  const { scanResultId, reviewStatus, actionTaken, notes, actorUserId, actorName } = req.body;
  if (!scanResultId) return res.status(400).json({ error: "scanResultId is required" });

  const client = supabaseAdmin || supabase;
  try {
    // 1. Find the flagged review
    const { data: reviewRow, error: findErr } = await client
      .from("similarity_flagged_reviews")
      .select("id, scan_result_id")
      .eq("scan_result_id", scanResultId)
      .single();
    if (findErr) throw findErr;

    // 2. Update the review
    const { error: updateErr } = await client
      .from("similarity_flagged_reviews")
      .update({
        review_status: reviewStatus || "Reviewed",
        action_taken: actionTaken || null,
        coordinator_notes: notes || null,
        reviewed_by: actorUserId || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewRow.id);
    if (updateErr) throw updateErr;

    res.json({ success: true });

    // 3. Log the event
    await logAuditTrail(req, {
      action: "Review",
      description: `Reviewed similarity report for Scan ID: ${scanResultId}. Status: ${reviewStatus}, Action: ${actionTaken || 'None'}`,
      moduleAffected: "Similarity Check",
      recordId: reviewRow.id,
      recordType: "similarity_flagged_reviews",
      newValues: { reviewStatus, actionTaken, notes },
      actorUserId: actorUserId || null,
      actorName: actorName || "Coordinator"
    });
  } catch (err) {
    console.error("[Similarity Review] Error:", err);
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

    // Log the event
    await logAuditTrail(req, {
      action: "Upload",
      description: `Initiated similarity scan for: "${fileName}"`,
      moduleAffected: "Similarity Check",
      recordId: data.id,
      recordType: "similarity_scan_queue",
      newValues: { fileName, proposedTitle, scanType },
      actorUserId: req.body.actorUserId || userId || null,
      actorName: req.body.actorName || "User"
    });
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

    // Log the event
    await logAuditTrail(req, {
      action: "Similarity",
      description: `Completed analysis for "${fileName}". Result: ${finalScore}% match [${resultRow.integrity_status}]`,
      moduleAffected: "Similarity Check",
      recordId: scanId,
      recordType: "similarity_scan_results",
      newValues: { overallScore: finalScore, status: resultRow.integrity_status, durationMs },
      actorUserId: req.body.actorUserId || userId || null,
      actorName: req.body.actorName || "User"
    });
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

/**
 * Global Audit Log Helper
 */
async function logAuditTrail(req, {
  action,
  description,
  moduleAffected = "Thesis Archiving",
  recordId = null,
  recordType = null,
  oldValues = null,
  newValues = null,
  actorUserId = null,
  actorName = null
}) {
  if (!supabaseAdmin) return;

  // Prioritize info passed in the options, then from req.body (from frontend), then defaults
  const finalActorId = actorUserId || req.body?.actorUserId || null;
  const finalActorName = actorName || req.body?.actorName || "System";

  try {
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const { error } = await supabaseAdmin
      .from("ta_audit_logs")
      .insert([{
        actor_user_id: finalActorId,
        actor_name: finalActorName,
        action,
        description,
        module_affected: moduleAffected,
        record_id: recordId ? String(recordId) : null,
        record_type: recordType,
        old_values: oldValues,
        new_values: newValues,
        ip_address: ipAddress || null,
        user_agent: userAgent
      }]);

    if (error) console.error("[AuditLog] Error inserting log:", error);
  } catch (err) {
    console.error("[AuditLog] Unexpected error:", err);
  }
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
