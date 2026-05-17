/**
 * Consolidated Folder Operations Handler
 * Route: /api/folders?operation=xxx
 * Operations: ensure, init-isams, rename, create
 */
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import getRawBody from "raw-body";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const operation = req.query.operation || req.query.op;

  if (!operation) {
    return res.status(400).json({ error: "Operation parameter required" });
  }

  try {
    switch (operation) {
      case "ensure":
        return handleEnsure(req, res);
      case "init-isams":
        return handleInitIsams(req, res);
      case "rename":
        return handleRename(req, res);
      case "create":
        return handleCreate(req, res);
      default:
        return res.status(404).json({ error: "Unknown operation" });
    }
  } catch (error) {
    console.error("Folders handler error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleEnsure(req, res) {
  try {
    const rawBody = await getRawBody(req, { limit: "1mb" });
    const {
      rootFolderId,
      syFolder,
      ayFolder,
      semesterFolder,
      courseCode,
      section,
    } = JSON.parse(rawBody.toString());

    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    let currentParent = rootFolderId || process.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

    if (syFolder) {
      currentParent = await getOrCreateFolder(drive, syFolder, currentParent);
    }

    if (ayFolder) {
      currentParent = await getOrCreateFolder(drive, ayFolder, currentParent);
    }

    if (semesterFolder) {
      currentParent = await getOrCreateFolder(
        drive,
        semesterFolder,
        currentParent,
      );
    }

    if (courseCode) {
      const courseFolderName = section
        ? `${courseCode} - ${section}`
        : courseCode;
      currentParent = await getOrCreateFolder(
        drive,
        courseFolderName,
        currentParent,
      );
    }

    res.json({ success: true, folderId: currentParent });
  } catch (error) {
    console.error("Ensure error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleInitIsams(req, res) {
  try {
    const rawBody = await getRawBody(req, { limit: "1mb" });
    const { rootFolderId } = JSON.parse(rawBody.toString());

    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const isamsFolder = await getOrCreateFolder(
      drive,
      "ISAMS",
      rootFolderId || "root",
    );

    res.json({ success: true, folderId: isamsFolder });
  } catch (error) {
    console.error("Init ISAMS error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleRename(req, res) {
  try {
    const rawBody = await getRawBody(req, { limit: "1mb" });
    const { rootFolderId, oldName, newName, parentFolderId } = JSON.parse(
      rawBody.toString(),
    );

    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const searchParent = parentFolderId || rootFolderId || "root";
    const query = `name='${oldName}' and '${searchParent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const { data } = await drive.files.list({
      q: query,
      fields: "files(id, name)",
      pageSize: 1,
    });

    if (!data.files || data.files.length === 0) {
      return res.status(404).json({ error: "Folder not found" });
    }

    await drive.files.update({
      fileId: data.files[0].id,
      requestBody: { name: newName },
    });

    res.json({ success: true, folderId: data.files[0].id });
  } catch (error) {
    console.error("Rename error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleCreate(req, res) {
  try {
    const rawBody = await getRawBody(req, { limit: "1mb" });
    const { folderName, parentFolderId } = JSON.parse(rawBody.toString());

    if (!folderName) {
      return res.status(400).json({ error: "Folder name required" });
    }

    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const folderId = await getOrCreateFolder(
      drive,
      folderName,
      parentFolderId || "root",
    );

    res.json({ success: true, folderId });
  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function getOrCreateFolder(drive, folderName, parentId) {
  const query = `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const { data } = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    pageSize: 1,
  });

  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  const fileMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: [parentId],
  };

  const { data: folder } = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id",
  });

  return folder.id;
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
