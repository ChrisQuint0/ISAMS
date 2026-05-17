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
        fields: "name, mimeType",
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
    "users",
    "thesis_archive",
    "thesis_authors",
    "thesis_advisers",
    "thesis_categories",
    "hte_trainees",
    "hte_notification_batches",
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
    `attachment; filename=backup-${Date.now()}.json`,
  );
  res.json(backup);
}

async function handleBackupRestore(req, res) {
  const rawBody = await getRawBody(req, { limit: "50mb" });
  const backup = JSON.parse(rawBody.toString());

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAdmin = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const results = {};

  for (const [table, data] of Object.entries(backup)) {
    if (!Array.isArray(data) || data.length === 0) {
      continue;
    }

    const { error } = await supabaseAdmin.from(table).upsert(data);

    if (error) {
      console.error(`Error restoring ${table}:`, error);
      results[table] = { success: false, error: error.message };
    } else {
      results[table] = { success: true, count: data.length };
    }
  }

  res.json({ success: true, results });
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
