/**
 * Consolidated File Operations Handler
 * Handles: list, metadata, delete, clone, move
 */
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import getRawBody from "raw-body";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  // In Vercel, [...path].js provides segments as req.query.path array
  const pathSegments = req.query.path || [];
  const operation = pathSegments[0];

  if (req.method === "GET" && operation !== "metadata") {
    return handleList(req, res);
  } else if (operation === "metadata") {
    return handleMetadata(req, res);
  } else if (operation === "delete") {
    return handleDelete(req, res);
  } else if (operation === "clone") {
    return handleClone(req, res);
  } else if (operation === "move") {
    return handleMove(req, res);
  }

  return res.status(404).json({ error: "Operation not found" });
}

async function handleList(req, res) {
  try {
    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const folderId =
      req.query.folderId || process.env.VITE_GOOGLE_DRIVE_FOLDER_ID || "root";
    const query = `'${folderId}' in parents and trashed=false`;

    const response = await drive.files.list({
      pageSize: 100,
      fields:
        "files(id, name, webViewLink, iconLink, createdTime, size, webContentLink, mimeType)",
      q: query,
      orderBy: "createdTime desc",
    });

    res.json(response.data.files || []);
  } catch (error) {
    console.error("List error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleMetadata(req, res) {
  try {
    const fileId = req.query.fileId;
    if (!fileId) return res.status(400).json({ error: "fileId required" });

    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const { data } = await drive.files.get({
      fileId: fileId,
      fields:
        "id, name, mimeType, size, createdTime, modifiedTime, webViewLink",
    });

    res.json(data);
  } catch (error) {
    console.error("Metadata error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleDelete(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const rawBody = await getRawBody(req, { limit: "1mb" });
    const { fileId } = JSON.parse(rawBody.toString());

    if (!fileId) return res.status(400).json({ error: "fileId required" });

    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    await drive.files.delete({ fileId: fileId });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleClone(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const rawBody = await getRawBody(req, { limit: "1mb" });
    const { fileId, newParentId } = JSON.parse(rawBody.toString());

    if (!fileId || !newParentId) {
      return res.status(400).json({ error: "fileId and newParentId required" });
    }

    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const { data } = await drive.files.copy({
      fileId: fileId,
      requestBody: { parents: [newParentId] },
      fields: "id, name, webViewLink",
    });

    res.json(data);
  } catch (error) {
    console.error("Clone error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleMove(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const rawBody = await getRawBody(req, { limit: "1mb" });
    const { fileId, newParentId } = JSON.parse(rawBody.toString());

    if (!fileId || !newParentId) {
      return res.status(400).json({ error: "fileId and newParentId required" });
    }

    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Get current parents
    const { data: file } = await drive.files.get({
      fileId: fileId,
      fields: "parents",
    });

    const previousParents = file.parents ? file.parents.join(",") : "";

    const { data } = await drive.files.update({
      fileId: fileId,
      addParents: newParentId,
      removeParents: previousParents,
      fields: "id, name, parents",
    });

    res.json(data);
  } catch (error) {
    console.error("Move error:", error);
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
