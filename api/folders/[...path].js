/**
 * Consolidated Folder Operations Handler
 * Handles: create, rename, ensure structure, init-isams
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

  // In Vercel, [...path].js provides segments as req.query.path array
  const pathSegments = req.query.path || [];
  const operation = pathSegments[0];
  
  if (operation === 'ensure') {
    return handleEnsure(req, res);
  } else if (operation === 'init-isams') {
    return handleInitIsams(req, res);
  } else if (operation === 'rename') {
    return handleRename(req, res);
  } else if (operation === 'create') {
    return handleCreate(req, res);
  }
  
  return res.status(404).json({ error: "Operation not found" });
}

async function handleEnsure(req, res) {
  try {
    const rawBody = await getRawBody(req, { limit: "1mb" });
    const { rootFolderId, syFolder, ayFolder, semesterFolder, courseCode, section } = JSON.parse(rawBody.toString());

    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    let currentParent = rootFolderId || process.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

    // Create School Year folder
    if (syFolder) {
      currentParent = await getOrCreateFolder(drive, syFolder, currentParent);
    }

    // Create AY folder
    if (ayFolder) {
      currentParent = await getOrCreateFolder(drive, ayFolder, currentParent);
    }

    // Create Semester folder
    if (semesterFolder) {
      currentParent = await getOrCreateFolder(drive, semesterFolder, currentParent);
    }

    // Create Course folder
    if (courseCode) {
      const courseFolderName = section ? `${courseCode} - ${section}` : courseCode;
      currentParent = await getOrCreateFolder(drive, courseFolderName, currentParent);
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

    const isamsFolder = await getOrCreateFolder(drive, "ISAMS", rootFolderId || "root");

    res.json({ success: true, isamsFolderId: isamsFolder });
  } catch (error) {
    console.error("Init ISAMS error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleRename(req, res) {
  try {
    const rawBody = await getRawBody(req, { limit: "1mb" });
    const { rootFolderId, oldFolderName, newFolderName } = JSON.parse(rawBody.toString());

    if (!oldFolderName || !newFolderName) {
      return res.status(400).json({ error: "oldFolderName and newFolderName required" });
    }

    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Search for folders with old name
    const query = `name='${oldFolderName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const { data } = await drive.files.list({
      q: query,
      fields: "files(id, name)",
      pageSize: 100,
    });

    const renamed = [];
    for (const folder of data.files || []) {
      await drive.files.update({
        fileId: folder.id,
        requestBody: { name: newFolderName },
      });
      renamed.push(folder.id);
    }

    res.json({ success: true, renamedCount: renamed.length, folderIds: renamed });
  } catch (error) {
    console.error("Rename error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleCreate(req, res) {
  try {
    const rawBody = await getRawBody(req, { limit: "1mb" });
    const { name, parentId } = JSON.parse(rawBody.toString());

    if (!name || !parentId) {
      return res.status(400).json({ error: "name and parentId required" });
    }

    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const folderId = await getOrCreateFolder(drive, name, parentId);

    res.json({ success: true, folderId });
  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function getOrCreateFolder(drive, folderName, parentId) {
  const safeName = sanitizeFolderName(folderName);
  const query = `name='${safeName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;
  
  const { data } = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    pageSize: 1,
  });

  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  const createRes = await drive.files.create({
    resource: {
      name: safeName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });

  return createRes.data.id;
}

function sanitizeFolderName(name) {
  if (!name) return "Untitled";
  return name.replace(/[\/\\:*?"<>|]/g, "").replace(/\s+/g, " ").trim() || "Untitled";
}

async function getAuthClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: scopedTokens } = await supabase
    .from("google_auth_tokens").select("*")
    .ilike("scope", "%googleapis.com/auth/drive%")
    .order("created_at", { ascending: false });

  const tokenRow = scopedTokens?.[0];
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
