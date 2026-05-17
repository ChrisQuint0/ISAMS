/**
 * Consolidated Thesis Operations Handler
 * Handles all thesis operations: create, update, delete, upload, download, data
 */
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import { Readable } from "stream";
import getRawBody from "raw-body";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  const path = req.url.split('?')[0];
  
  // Route to appropriate handler
  if (path.includes('/download/')) {
    return handleDownload(req, res);
  } else if (path.includes('/upload')) {
    return handleUpload(req, res);
  } else if (path.includes('/create')) {
    return handleCreate(req, res);
  } else if (path.includes('/update')) {
    return handleUpdate(req, res);
  } else if (path.includes('/delete')) {
    return handleDelete(req, res);
  } else if (path.includes('/advisers') || path.includes('/categories') || path.includes('/data')) {
    return handleData(req, res);
  }
  
  return res.status(404).json({ error: "Endpoint not found" });
}

async function handleDownload(req, res) {
  try {
    const fileId = req.url.split('/download/')[1]?.split('?')[0];
    if (!fileId) return res.status(400).json({ error: "File ID required" });

    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const { data: fileMetadata } = await drive.files.get({
      fileId: fileId,
      fields: "name, mimeType",
    });

    res.setHeader("Content-Type", fileMetadata.mimeType || "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileMetadata.name}"`);

    const response = await drive.files.get(
      { fileId: fileId, alt: "media" },
      { responseType: "stream" }
    );

    response.data.on("error", (err) => {
      console.error("Stream error:", err);
      if (!res.headersSent) res.status(500).json({ error: "Stream failed" });
    }).pipe(res);
  } catch (error) {
    console.error("Download error:", error);
    if (!res.headersSent) res.status(500).json({ error: error.message });
  }
}

async function handleUpload(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const rawBody = await getRawBody(req, { length: req.headers["content-length"], limit: "50mb" });
    const contentType = req.headers["content-type"] || "";
    const boundary = contentType.split("boundary=")[1];

    const parts = rawBody.toString("binary").split(`--${boundary}`);
    let fileBuffer = null;
    let fileName = "upload.pdf";

    for (const part of parts) {
      const fileNameMatch = part.match(/filename="([^"]+)"/);
      if (fileNameMatch) {
        fileName = fileNameMatch[1];
        const contentStart = part.indexOf('\r\n\r\n') + 4;
        const contentEnd = part.lastIndexOf('\r\n');
        if (contentStart > 3 && contentEnd > contentStart) {
          fileBuffer = Buffer.from(part.substring(contentStart, contentEnd), 'binary');
        }
      }
    }

    if (!fileBuffer) return res.status(400).json({ error: "No file found" });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const finalFileName = `${timestamp}-${fileName}`;
    const folderId = "1oTrBXMT3KxBORnVBtaGJ0JlSeiJ1GgmD";

    const file = await drive.files.create({
      resource: { name: finalFileName, parents: [folderId] },
      media: { mimeType: "application/pdf", body: Readable.from(fileBuffer) },
      fields: "id, name, webViewLink, webContentLink",
    });

    res.json(file.data);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleCreate(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const rawBody = await getRawBody(req, { limit: "10mb" });
  const { entry, authors, gdriveFile } = JSON.parse(rawBody.toString());

  if (!entry || !authors || !gdriveFile) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { supabaseAdmin } = await getSupabaseClients();

    const { data: thesis, error: thesisError } = await supabaseAdmin
      .from("thesis_entries").insert([entry]).select().single();
    if (thesisError) throw thesisError;

    const authorsToInsert = authors.map((author, index) => ({
      thesis_id: thesis.id,
      first_name: author.firstName,
      last_name: author.lastName,
      display_order: index + 1,
    }));

    await supabaseAdmin.from("thesis_authors").insert(authorsToInsert);

    await supabaseAdmin.from("thesis_files").insert([{
      thesis_id: thesis.id,
      original_filename: entry.title + ".pdf",
      storage_path: gdriveFile.id,
      storage_bucket: "google-drive",
      mime_type: "application/pdf",
    }]);

    res.json({ success: true, thesis });
  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleUpdate(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const rawBody = await getRawBody(req, { limit: "10mb" });
  const { id, entry, authors, gdriveFile } = JSON.parse(rawBody.toString());

  if (!id || !entry || !authors) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { supabaseAdmin } = await getSupabaseClients();

    const { data: oldEntry } = await supabaseAdmin
      .from("thesis_entries").select("*, files:thesis_files(*)").eq("id", id).single();

    await supabaseAdmin.from("thesis_entries").update(entry).eq("id", id);
    await supabaseAdmin.from("thesis_authors").delete().eq("thesis_id", id);

    const authorsToInsert = authors.map((author, index) => ({
      thesis_id: id,
      first_name: author.firstName,
      last_name: author.lastName,
      display_order: index + 1,
    }));
    await supabaseAdmin.from("thesis_authors").insert(authorsToInsert);

    if (gdriveFile && oldEntry?.files?.[0]?.storage_path) {
      try {
        const { oauth2Client } = await getAuthClient();
        const drive = google.drive({ version: "v3", auth: oauth2Client });
        await drive.files.delete({ fileId: oldEntry.files[0].storage_path });
      } catch (e) {
        console.error("Error deleting old file:", e);
      }

      await supabaseAdmin.from("thesis_files").update({
        original_filename: entry.title + ".pdf",
        storage_path: gdriveFile.id,
      }).eq("thesis_id", id);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleDelete(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const rawBody = await getRawBody(req, { limit: "1mb" });
  const { id } = JSON.parse(rawBody.toString());

  if (!id) return res.status(400).json({ error: "ID required" });

  try {
    const { supabaseAdmin } = await getSupabaseClients();

    const { data: thesis } = await supabaseAdmin
      .from("thesis_entries").select("files:thesis_files(storage_path)").eq("id", id).single();

    if (thesis?.files) {
      try {
        const { oauth2Client } = await getAuthClient();
        const drive = google.drive({ version: "v3", auth: oauth2Client });
        for (const file of thesis.files) {
          if (file.storage_path) {
            await drive.files.delete({ fileId: file.storage_path });
          }
        }
      } catch (e) {
        console.error("Error deleting files:", e);
      }
    }

    await supabaseAdmin.from("thesis_entries").update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    }).eq("id", id);

    res.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleData(req, res) {
  try {
    const { supabase } = await getSupabaseClients();

    if (req.url.includes('/advisers')) {
      const { data } = await supabase.from("vw_adviser_display").select("*").order("display_name", { ascending: true });
      return res.json(data || []);
    }

    if (req.url.includes('/categories')) {
      const { data } = await supabase.from("thesis_categories").select("*").order("name", { ascending: true });
      return res.json(data || []);
    }

    const [advisersResult, categoriesResult] = await Promise.all([
      supabase.from("vw_adviser_display").select("*").order("display_name", { ascending: true }),
      supabase.from("thesis_categories").select("*").order("name", { ascending: true }),
    ]);

    res.json({
      advisers: advisersResult.data || [],
      categories: categoriesResult.data || [],
    });
  } catch (error) {
    console.error("Data error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function getAuthClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: tokenRow } = await supabase
    .from("google_auth_tokens").select("*")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (!tokenRow) throw new Error("Not authenticated");

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

  return { oauth2Client };
}

async function getSupabaseClients() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
  const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
  return { supabase, supabaseAdmin };
}
