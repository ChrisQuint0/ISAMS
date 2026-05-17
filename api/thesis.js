/**
 * Consolidated Thesis Operations Handler
 * Route: /api/thesis?operation=xxx
 * Operations: download, upload, create, update, delete, advisers, categories, data
 */
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import getRawBody from "raw-body";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  const operation = req.query.operation || req.query.op;

  if (!operation) {
    return res.status(400).json({ error: "Operation parameter required" });
  }

  try {
    switch (operation) {
      case "download":
        return handleDownload(req, res);
      case "upload":
        return handleUpload(req, res);
      case "create":
        return handleCreate(req, res);
      case "update":
        return handleUpdate(req, res);
      case "delete":
        return handleDelete(req, res);
      case "advisers":
        return handleAdvisers(req, res);
      case "categories":
        return handleCategories(req, res);
      case "data":
        return handleData(req, res);
      default:
        return res.status(404).json({ error: "Unknown operation" });
    }
  } catch (error) {
    console.error("Thesis handler error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleDownload(req, res) {
  try {
    const fileId = req.query.fileId;
    if (!fileId) return res.status(400).json({ error: "File ID required" });

    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const { data: fileMetadata } = await drive.files.get({
      fileId: fileId,
      fields: "name, mimeType",
    });

    res.setHeader("Content-Type", fileMetadata.mimeType || "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileMetadata.name}"`,
    );

    const response = await drive.files.get(
      { fileId: fileId, alt: "media" },
      { responseType: "stream" },
    );

    response.data
      .on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to stream file" });
        }
      })
      .pipe(res);
  } catch (error) {
    console.error("Download error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
}

async function handleUpload(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const rawBody = await getRawBody(req, { limit: "50mb" });
    const boundary = req.headers["content-type"]?.split("boundary=")[1];

    if (!boundary) {
      return res.status(400).json({ error: "Missing multipart boundary" });
    }

    const parts = parseMultipart(rawBody, boundary);
    const filePart = parts.find((p) => p.name === "file");

    if (!filePart) {
      return res.status(400).json({ error: "No file in request" });
    }

    const metadata = {
      name: filePart.filename,
      parents: [process.env.VITE_GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: filePart.contentType,
      body: require("stream").Readable.from(filePart.data),
    };

    const { data: file } = await drive.files.create({
      requestBody: metadata,
      media: media,
      fields: "id, name, webViewLink",
    });

    await drive.permissions.create({
      fileId: file.id,
      requestBody: { role: "reader", type: "anyone" },
    });

    res.json(file);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleCreate(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawBody = await getRawBody(req, { limit: "10mb" });
    const { entry, authors, gdriveFile } = JSON.parse(rawBody.toString());

    if (!entry || !authors || !gdriveFile) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { supabaseAdmin } = await getSupabaseClients();

    const { data: newEntry, error: entryError } = await supabaseAdmin
      .from("thesis_entries")
      .insert(entry)
      .select()
      .single();

    if (entryError) throw entryError;

    const authorsToInsert = authors.map((author, index) => ({
      thesis_id: newEntry.id,
      first_name: author.firstName,
      last_name: author.lastName,
      display_order: index + 1,
    }));

    await supabaseAdmin.from("thesis_authors").insert(authorsToInsert);

    await supabaseAdmin.from("thesis_files").insert({
      thesis_id: newEntry.id,
      original_filename: entry.title + ".pdf",
      storage_path: gdriveFile.id,
    });

    res.json({ success: true, thesis: newEntry });
  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleUpdate(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawBody = await getRawBody(req, { limit: "10mb" });
    const { id, entry, authors, gdriveFile } = JSON.parse(rawBody.toString());

    if (!id || !entry || !authors) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { supabaseAdmin } = await getSupabaseClients();

    const { data: oldEntry } = await supabaseAdmin
      .from("thesis_entries")
      .select("*, files:thesis_files(*)")
      .eq("id", id)
      .single();

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

      await supabaseAdmin
        .from("thesis_files")
        .update({
          original_filename: entry.title + ".pdf",
          storage_path: gdriveFile.id,
        })
        .eq("thesis_id", id);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleDelete(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawBody = await getRawBody(req, { limit: "1mb" });
    const { id } = JSON.parse(rawBody.toString());

    if (!id) {
      return res.status(400).json({ error: "ID required" });
    }

    const { supabaseAdmin } = await getSupabaseClients();

    const { data: thesis } = await supabaseAdmin
      .from("thesis_entries")
      .select("files:thesis_files(storage_path)")
      .eq("id", id)
      .single();

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

    await supabaseAdmin
      .from("thesis_entries")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id);

    res.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleAdvisers(req, res) {
  try {
    const { supabase } = await getSupabaseClients();
    const { data } = await supabase
      .from("vw_adviser_display")
      .select("*")
      .order("display_name", { ascending: true });
    res.json(data || []);
  } catch (error) {
    console.error("Advisers error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleCategories(req, res) {
  try {
    const { supabase } = await getSupabaseClients();
    const { data } = await supabase
      .from("thesis_categories")
      .select("*")
      .order("name", { ascending: true });
    res.json(data || []);
  } catch (error) {
    console.error("Categories error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleData(req, res) {
  try {
    const { supabase } = await getSupabaseClients();

    const [advisersResult, categoriesResult] = await Promise.all([
      supabase
        .from("vw_adviser_display")
        .select("*")
        .order("display_name", { ascending: true }),
      supabase
        .from("thesis_categories")
        .select("*")
        .order("name", { ascending: true }),
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

function parseMultipart(buffer, boundary) {
  const parts = [];
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  let start = 0;

  while (start < buffer.length) {
    const boundaryIndex = buffer.indexOf(boundaryBuffer, start);
    if (boundaryIndex === -1) break;

    const nextBoundary = buffer.indexOf(
      boundaryBuffer,
      boundaryIndex + boundaryBuffer.length,
    );
    if (nextBoundary === -1) break;

    const partData = buffer.slice(
      boundaryIndex + boundaryBuffer.length,
      nextBoundary,
    );
    const headerEnd = partData.indexOf(Buffer.from("\r\n\r\n"));

    if (headerEnd !== -1) {
      const headers = partData.slice(0, headerEnd).toString();
      const data = partData.slice(headerEnd + 4, partData.length - 2);

      const nameMatch = headers.match(/name="([^"]+)"/);
      const filenameMatch = headers.match(/filename="([^"]+)"/);
      const contentTypeMatch = headers.match(/Content-Type: (.+)/i);

      if (nameMatch) {
        parts.push({
          name: nameMatch[1],
          filename: filenameMatch ? filenameMatch[1] : null,
          contentType: contentTypeMatch
            ? contentTypeMatch[1].trim()
            : "application/octet-stream",
          data: data,
        });
      }
    }

    start = nextBoundary;
  }

  return parts;
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

  return { oauth2Client };
}

async function getSupabaseClients() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabase = createClient(
    supabaseUrl,
    process.env.VITE_SUPABASE_ANON_KEY,
  );
  const supabaseAdmin = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  return { supabase, supabaseAdmin };
}
