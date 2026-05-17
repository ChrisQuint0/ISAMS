/**
 * Consolidated Export Operations Handler
 * Route: /api/export?operation=xxx
 * Operations: faculty, archive, backup-export, backup-restore
 */
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import getRawBody from "raw-body";
import JSZip from "jszip";

export const config = {
  api: { bodyParser: false },
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const operation = req.query.operation || req.query.op;

  if (!operation) {
    return res.status(400).json({ error: "Operation parameter required" });
  }

  try {
    switch (operation) {
      case "faculty":
        return handleFacultyExport(req, res);
      case "archive":
        return handleArchiveExport(req, res);
      case "backup-export":
        return handleBackupExport(req, res);
      case "backup-restore":
        return handleBackupRestore(req, res);
      default:
        return res.status(404).json({ error: "Unknown operation" });
    }
  } catch (error) {
    console.error("Export error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleFacultyExport(req, res) {
  const rawBody = await getRawBody(req, { limit: "10mb" });
  const body = JSON.parse(rawBody.toString());

  // Accept new `files` array (with folder/filename) or legacy `fileIds`
  const files = body.files || (body.fileIds || []).map((id) => ({ fileId: id, folder: "", filename: id }));

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "files array required" });
  }

  const { drive } = await getAuthClient();
  const zip = new JSZip();
  const CONCURRENCY = 15;

  const downloadOne = async ({ fileId, folder, filename }) => {
    if (!fileId) return;
    try {
      const { data: fileStream } = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream" },
      );
      const chunks = [];
      for await (const chunk of fileStream) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);
      const zipPath = folder ? `${folder}/${filename}` : filename;
      zip.file(zipPath, buffer);
    } catch (err) {
      console.error(`Failed to download file ${fileId}:`, err.message);
    }
  };

  // Download in parallel batches of CONCURRENCY
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    await Promise.all(files.slice(i, i + CONCURRENCY).map(downloadOne));
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", "attachment; filename=export.zip");
  res.send(zipBuffer);
}

async function handleArchiveExport(req, res) {
  const rawBody = await getRawBody(req, { limit: "10mb" });
  const { fileIds } = JSON.parse(rawBody.toString());

  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ error: "fileIds array required" });
  }

  const { drive } = await getAuthClient();
  const zip = new JSZip();

  for (const fileId of fileIds) {
    try {
      const { data: metadata } = await drive.files.get({
        fileId,
        fields: "name",
      });

      const { data: fileStream } = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream" },
      );

      const chunks = [];
      for await (const chunk of fileStream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      zip.file(metadata.name, buffer);
    } catch (error) {
      console.error(`Failed to download file ${fileId}:`, error);
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", "attachment; filename=archive.zip");
  res.send(zipBuffer);
}

async function handleBackupExport(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAdmin = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const tables = [
    // ── Faculty Submission (FS) ──────────────────────────────────────────
    "faculty_fs",
    "systemsettings_fs",
    "documenttypes_fs",
    "courses_fs",
    "master_courses_fs",
    "templates_fs",
    "faq_fs",
    "deadlines_fs",
    "submissions_fs",
    "documentversions_fs",
    "notifications_fs",
    "holidays_fs",
    "reporthistory_fs",
    "semester_history_fs",
    "google_auth_tokens",

    // ── Access Control ───────────────────────────────────────────────────
    "user_rbac",

    // ── Student Violations (SV) ──────────────────────────────────────────
    "students_sv",
    "offense_types_sv",
    "sanctions_sv",
    "violations_sv",
    "violation_evidence_sv",
    "student_sanctions_sv",
    "compliance_evidence_sv",
    "activity_log_sv",

    // ── Lab Management (LM) ──────────────────────────────────────────────
    "laboratories_lm",
    "pc_stations_lm",
    "students_lists_lm",
    "lab_schedules_lm",
    "student_enrollments_lm",
    "attendance_logs_lm",
    "pc_maintenance_history_lm",
    "audit_logs_lm",
    "lab_settings_lm",

    // ── Thesis Archive (TA) ───────────────────────────────────────────────
    "thesis_categories",
    "thesis_advisers",
    "thesis_academic_years",
    "thesis_entries",
    "thesis_authors",
    "thesis_files",
    "thesis_settings",
    "thesis_similarity_results",
    "similarity_matches",
    "similarity_scan_queue",
    "similarity_scan_results",
    "similarity_scan_field_scores",
    "similarity_scan_matches",
    "similarity_flagged_reviews",
    "similarity_settings_history",
    "ta_audit_logs",

    // ── HTE / OJT ────────────────────────────────────────────────────────
    "hte_document_categories",
    "hte_document_fields",
    "hte_sections",
    "hte_ojt_students",
    "hte_document_uploads",
    "hte_notification_batches",
    "hte_notification_recipients",
    "hte_notification_cooldowns",

    // ── Global / Shared ──────────────────────────────────────────────────
    "system_settings",
    "system_config",
    "report_export_logs",
    "student_otp_codes",
  ];

  const backup = {};

  for (const table of tables) {
    const { data, error } = await supabaseAdmin.from(table).select("*");
    if (error) {
      console.error(`Error backing up ${table}:`, error);
      continue;
    }
    backup[table] = data;
  }

  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=isams-backup-${Date.now()}.json`,
  );
  // Wrap in the ISAMS envelope so the client-side validator passes
  res.json({
    source: "ISAMS",
    version: "1.0",
    exported_at: new Date().toISOString(),
    tables: backup,
  });
}

async function handleBackupRestore(req, res) {
  const rawBody = await getRawBody(req, { limit: "50mb" });
  const body = JSON.parse(rawBody.toString());

  // Frontend sends: { backup: parsedBackupFile }
  // parsedBackupFile is either the new envelope { source, version, tables: {...} }
  // or a legacy flat { tableName: [...] } object
  const backupFile = body.backup || body;
  const tables = backupFile.tables || backupFile; // unwrap envelope or use flat

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAdmin = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const results = {};
  let totalUpserted = 0;

  for (const [table, data] of Object.entries(tables)) {
    // Skip envelope metadata fields that aren't table names
    if (!Array.isArray(data) || data.length === 0) continue;

    const { error } = await supabaseAdmin.from(table).upsert(data);

    if (error) {
      console.error(`Error restoring ${table}:`, error);
      results[table] = { success: false, error: error.message };
    } else {
      results[table] = { success: true, count: data.length };
      totalUpserted += data.length;
    }
  }

  res.json({ success: true, totalUpserted, results });
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

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  return { drive, oauth2Client };
}
