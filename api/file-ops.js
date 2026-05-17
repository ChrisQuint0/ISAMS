/**
 * Consolidated File Operations Handler
 * Route: /api/file-ops?operation=xxx
 * Operations: list, metadata, search, clone, delete, move
 */
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import getRawBody from "raw-body";

export const config = {
  api: { bodyParser: false },
  maxDuration: 60,
};

export default async function handler(req, res) {
  const operation = req.query.operation || req.query.op;

  if (!operation) {
    return res.status(400).json({ error: "Operation parameter required" });
  }

  try {
    switch (operation) {
      case "list":
        return handleList(req, res);
      case "metadata":
        return handleMetadata(req, res);
      case "search":
        return handleSearch(req, res);
      case "clone":
        return handleClone(req, res);
      case "delete":
        return handleDelete(req, res);
      case "move":
        return handleMove(req, res);
      default:
        return res.status(404).json({ error: "Unknown operation" });
    }
  } catch (error) {
    console.error("File ops error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleList(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { folderId } = req.query;
  if (!folderId) {
    return res.status(400).json({ error: "folderId required" });
  }

  const { drive } = await getAuthClient();
  const { data } = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name, mimeType, createdTime, modifiedTime, size)",
    orderBy: "name",
  });

  res.json({ files: data.files || [] });
}

async function handleMetadata(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fileId } = req.query;
  if (!fileId) {
    return res.status(400).json({ error: "fileId required" });
  }

  const { drive } = await getAuthClient();
  const { data } = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, createdTime, modifiedTime, size, parents",
  });

  res.json(data);
}

async function handleSearch(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query, parentId } = req.query;
  if (!query) {
    return res.status(400).json({ error: "query required" });
  }

  const { drive } = await getAuthClient();
  const searchQuery = parentId
    ? `name contains '${query}' and '${parentId}' in parents and trashed=false`
    : `name contains '${query}' and trashed=false`;

  const { data } = await drive.files.list({
    q: searchQuery,
    fields: "files(id, name, mimeType, parents)",
    pageSize: 50,
  });

  res.json({ files: data.files || [] });
}

async function handleClone(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawBody = await getRawBody(req, { limit: "1mb" });
  const { fileId, newName, targetFolderId } = JSON.parse(rawBody.toString());

  if (!fileId) {
    return res.status(400).json({ error: "fileId required" });
  }

  const { drive } = await getAuthClient();
  const { data } = await drive.files.copy({
    fileId,
    requestBody: {
      name: newName || undefined,
      parents: targetFolderId ? [targetFolderId] : undefined,
    },
  });

  res.json({ success: true, fileId: data.id });
}

async function handleDelete(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawBody = await getRawBody(req, { limit: "1mb" });
  const { fileId } = JSON.parse(rawBody.toString());

  if (!fileId) {
    return res.status(400).json({ error: "fileId required" });
  }

  const { drive } = await getAuthClient();
  await drive.files.delete({ fileId });

  res.json({ success: true });
}

async function handleMove(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawBody = await getRawBody(req, { limit: "1mb" });
  const { fileId, targetFolderId } = JSON.parse(rawBody.toString());

  if (!fileId || !targetFolderId) {
    return res.status(400).json({ error: "fileId and targetFolderId required" });
  }

  const { drive } = await getAuthClient();
  const { data: file } = await drive.files.get({
    fileId,
    fields: "parents",
  });

  const previousParents = file.parents ? file.parents.join(",") : "";

  await drive.files.update({
    fileId,
    addParents: targetFolderId,
    removeParents: previousParents,
    fields: "id, parents",
  });

  res.json({ success: true });
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
