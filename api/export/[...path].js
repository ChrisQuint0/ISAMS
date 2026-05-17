/**
 * Consolidated Export Operations Handler
 * Handles: archive export (ZIP), database backup, database restore
 */
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import getRawBody from "raw-body";

export const config = {
  api: { bodyParser: false },
};

const BACKUP_TABLES = [
  { name: "faculty_fs", pk: "faculty_id" },
  { name: "master_courses_fs", pk: "id" },
  { name: "courses_fs", pk: "course_id" },
  { name: "documenttypes_fs", pk: "doc_type_id" },
  { name: "deadlines_fs", pk: "deadline_id" },
  { name: "semester_history_fs", pk: "id" },
  { name: "submissions_fs", pk: "submission_id" },
  { name: "documentversions_fs", pk: "version_id" },
  { name: "systemsettings_fs", pk: "setting_key" },
  { name: "holidays_fs", pk: "holiday_id" },
];

export default async function handler(req, res) {
  // In Vercel, [...path].js provides segments as req.query.path array
  const pathSegments = req.query.path || [];
  const operation = pathSegments.join("/");

  if (operation === "archive") {
    return handleArchiveExport(req, res);
  } else if (operation === "backup/export") {
    return handleBackupExport(req, res);
  } else if (operation === "backup/restore") {
    return handleBackupRestore(req, res);
  } else if (operation === "faculty/export") {
    return handleFacultyExport(req, res);
  }

  return res.status(404).json({ error: "Operation not found" });
}

async function handleArchiveExport(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const rawBody = await getRawBody(req, { limit: "10mb" });
    const { fileIds } = JSON.parse(rawBody.toString());

    if (!fileIds || !Array.isArray(fileIds)) {
      return res.status(400).json({ error: "fileIds array required" });
    }

    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const zip = new JSZip();

    for (const fileId of fileIds) {
      try {
        const { data: metadata } = await drive.files.get({
          fileId: fileId,
          fields: "name",
        });

        const response = await drive.files.get(
          { fileId: fileId, alt: "media" },
          { responseType: "arraybuffer" },
        );

        zip.file(metadata.name, response.data);
      } catch (err) {
        console.error(`Failed to add file ${fileId}:`, err.message);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="archive-${Date.now()}.zip"`,
    );
    res.send(zipBuffer);
  } catch (error) {
    console.error("Archive export error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleFacultyExport(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const rawBody = await getRawBody(req, { limit: "10mb" });
    const { fileIds } = JSON.parse(rawBody.toString());

    if (!fileIds || !Array.isArray(fileIds)) {
      return res.status(400).json({ error: "fileIds array required" });
    }

    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const zip = new JSZip();

    for (const fileId of fileIds) {
      try {
        const { data: metadata } = await drive.files.get({
          fileId: fileId,
          fields: "name",
        });

        const response = await drive.files.get(
          { fileId: fileId, alt: "media" },
          { responseType: "arraybuffer" },
        );

        zip.file(metadata.name, response.data);
      } catch (err) {
        console.error(`Failed to add file ${fileId}:`, err.message);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="faculty-export-${Date.now()}.zip"`,
    );
    res.send(zipBuffer);
  } catch (error) {
    console.error("Faculty export error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleBackupExport(req, res) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAdmin = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const backup = {
      timestamp: new Date().toISOString(),
      tables: {},
    };

    for (const table of BACKUP_TABLES) {
      const { data, error } = await supabaseAdmin.from(table.name).select("*");
      if (error) {
        console.error(`Error backing up ${table.name}:`, error);
        backup.tables[table.name] = { error: error.message };
      } else {
        backup.tables[table.name] = { rowCount: data.length, rows: data };
      }
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="isams-backup-${Date.now()}.json"`,
    );
    res.json(backup);
  } catch (error) {
    console.error("Backup export error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleBackupRestore(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const rawBody = await getRawBody(req, { limit: "50mb" });
    const backup = JSON.parse(rawBody.toString());

    if (!backup.tables) {
      return res.status(400).json({ error: "Invalid backup format" });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAdmin = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const results = {};

    for (const table of BACKUP_TABLES) {
      const tableData = backup.tables[table.name];
      if (!tableData || !tableData.rows || tableData.rows.length === 0) {
        results[table.name] = { skipped: true };
        continue;
      }

      try {
        const { error } = await supabaseAdmin
          .from(table.name)
          .upsert(tableData.rows);
        if (error) {
          results[table.name] = { error: error.message };
        } else {
          results[table.name] = {
            success: true,
            rowCount: tableData.rows.length,
          };
        }
      } catch (err) {
        results[table.name] = { error: err.message };
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error("Backup restore error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function getAuthClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: scopedTokens } = await supabase
    .from("google_auth_tokens")
    .select("*")
    .ilike("scope", "%googleapis.com/auth/drive%")
    .order("created_at", { ascending: false });

  const tokenRow = scopedTokens?.[0];
  if (!tokenRow) throw new Error("Not authenticated");

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
