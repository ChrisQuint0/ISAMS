/**
 * Consolidated Submission Operations Handler
 * Route: /api/submission?operation=xxx
 * Operations: upload, validate, send-email, status, folder-rename
 */

import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import sgMail from "@sendgrid/mail";
import getRawBody from "raw-body";
import Busboy from "busboy";
import { Readable } from "stream";

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
      case "upload":
        return await handleUpload(req, res);
      case "initiate-upload":
        return await handleInitiateUpload(req, res);
      case "upload-chunk":
        return await handleUploadChunk(req, res);
      case "validate":
        return await handleValidate(req, res);
      case "send-email":
        return await handleSendEmail(req, res);
      case "status":
        return await handleStatus(req, res);
      case "folder-rename":
        return await handleFolderRename(req, res);
      default:
        return res.status(404).json({ error: "Unknown operation" });
    }
  } catch (error) {
    console.error("Submission error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleUpload(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { drive } = await getAuthClient();

  return new Promise((resolve) => {
    const busboy = Busboy({ headers: req.headers });
    let fileBuffer;
    let fileName;
    let mimeType;
    let folderId;

    busboy.on("file", (fieldname, file, info) => {
      fileName = info.filename;
      mimeType = info.mimeType;
      const chunks = [];
      file.on("data", (data) => chunks.push(data));
      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on("field", (fieldname, val) => {
      if (fieldname === "folderId") {
        folderId = val;
      }
    });

    busboy.on("finish", async () => {
      try {
        if (!fileBuffer || !fileName) {
          res.status(400).json({ error: "No file provided" });
          return resolve();
        }

        const { data } = await drive.files.create({
          requestBody: {
            name: fileName,
            parents: folderId ? [folderId] : undefined,
          },
          media: {
            mimeType,
            body: Readable.from(fileBuffer),
          },
          fields: "id, name, mimeType, webViewLink, webContentLink",
        });

        // id/name/webViewLink/webContentLink must match what gdriveSettings.uploadToGDrive callers expect
        res.json({
          success: true,
          id: data.id,
          name: data.name,
          mimeType: data.mimeType,
          webViewLink: data.webViewLink,
          webContentLink: data.webContentLink,
        });
        resolve();
      } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: error.message });
        resolve();
      }
    });

    // Vercel plain Node.js functions expose req as a raw IncomingMessage stream — piping works directly
    req.pipe(busboy);
  });
}


async function handleValidate(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const files = [];

    busboy.on("file", (fieldname, file, info) => {
      const chunks = [];
      file.on("data", (data) => chunks.push(data));
      file.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const isValid =
          info.mimeType.startsWith("image/") &&
          buffer.length < 10 * 1024 * 1024;
        files.push({
          filename: info.filename,
          mimeType: info.mimeType,
          size: buffer.length,
          valid: isValid,
        });
      });
    });

    busboy.on("finish", () => {
      res.json({
        success: true,
        files,
        allValid: files.every((f) => f.valid),
      });
      resolve();
    });

    req.pipe(busboy);
  });
}

async function handleSendEmail(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (!sendgridKey) {
    return res.status(500).json({ error: "SendGrid not configured" });
  }

  sgMail.setApiKey(sendgridKey);

  const rawBody = await getRawBody(req, { limit: "1mb" });
  const { to, subject, text, html } = JSON.parse(rawBody.toString());

  if (!to || !subject) {
    return res.status(400).json({ error: "to and subject required" });
  }

  const msg = {
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME || "ISAMS",
    },
    subject,
    text: text || "",
    html: html || text || "",
  };

  await sgMail.send(msg);
  res.json({ success: true });
}

async function handleStatus(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { oauth2Client } = await getAuthClient();
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    await drive.files.list({ pageSize: 1 });

    res.json({ authenticated: true });
  } catch (error) {
    res.json({ authenticated: false, error: error.message });
  }
}

async function handleFolderRename(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawBody = await getRawBody(req, { limit: "1mb" });
  const body = JSON.parse(rawBody.toString());

  // Support both field name formats:
  //   - { oldFolderName, newFolderName } sent by gdriveSettings.renameGDriveFolders
  //   - { oldName, newName } (legacy)
  const oldName = body.oldFolderName || body.oldName;
  const newName = body.newFolderName || body.newName;

  if (!oldName || !newName) {
    return res.status(400).json({ error: "oldName/oldFolderName and newName/newFolderName are required" });
  }

  const { drive } = await getAuthClient();
  const query = `name='${oldName.replace(/'/g, "\\'")}'  and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const { data } = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    pageSize: 100,
  });

  const renamed = [];
  for (const folder of data.files || []) {
    await drive.files.update({
      fileId: folder.id,
      requestBody: { name: newName },
    });
    renamed.push(folder.id);
  }

  res.json({
    success: true,
    renamed: renamed.length,   // frontend reads result.renamed
    renamedCount: renamed.length, // keep legacy field for safety
    folderIds: renamed,
    message: `Renamed ${renamed.length} folder(s) from "${oldName}" to "${newName}".`,
  });
}

/**
 * handleInitiateUpload
 * Creates a Google Drive resumable upload session.
 * Returns the session URI which the client passes back with each chunk.
 *
 * Body: { folderId, fileName, mimeType, fileSize }
 * Response: { sessionUri }
 */
async function handleInitiateUpload(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawBody = await getRawBody(req, { limit: "1mb" });
  const { folderId, fileName, mimeType, fileSize } = JSON.parse(
    rawBody.toString(),
  );

  if (!fileName || !mimeType) {
    return res
      .status(400)
      .json({ error: "fileName and mimeType are required" });
  }

  const { oauth2Client } = await getAuthClient();

  // Ensure we have a fresh access token
  const { token: accessToken } = await oauth2Client.getAccessToken();

  const fileMetadata = {
    name: fileName,
    ...(folderId ? { parents: [folderId] } : {}),
  };

  // Open a resumable upload session with Google Drive
  const initRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id%2Cname%2CwebViewLink%2CwebContentLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": mimeType,
        ...(fileSize ? { "X-Upload-Content-Length": String(fileSize) } : {}),
      },
      body: JSON.stringify(fileMetadata),
    },
  );

  if (!initRes.ok) {
    const errText = await initRes.text().catch(() => "");
    console.error("[InitiateUpload] Drive API error:", initRes.status, errText);
    return res
      .status(500)
      .json({ error: `Drive session initiation failed (HTTP ${initRes.status})` });
  }

  // Google Drive returns the session URI in the Location response header
  const sessionUri = initRes.headers.get("location");
  if (!sessionUri) {
    return res
      .status(500)
      .json({ error: "Google Drive did not return a session URI" });
  }

  res.json({ success: true, sessionUri });
}

/**
 * handleUploadChunk
 * Receives a raw binary chunk from the client and forwards it to the
 * Google Drive resumable upload session using the Content-Range protocol.
 *
 * Each chunk must be ≤3 MB so it stays under Vercel's 4.5 MB payload limit.
 *
 * Headers required:
 *   X-Session-Uri  — the Drive resumable session URI from handleInitiateUpload
 *   X-Chunk-Start  — byte offset of this chunk (0-based)
 *   X-Total-Size   — total file size in bytes
 *
 * Body: raw binary (application/octet-stream)
 *
 * Response:
 *   { complete: false, uploaded: N }  — chunk accepted, N bytes received so far
 *   { complete: true,  file: {...} }   — final chunk, Drive file metadata returned
 */
async function handleUploadChunk(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sessionUri = req.headers["x-session-uri"];
  const chunkStart = parseInt(req.headers["x-chunk-start"], 10);
  const totalSize = parseInt(req.headers["x-total-size"], 10);

  if (!sessionUri || isNaN(chunkStart) || isNaN(totalSize)) {
    return res.status(400).json({
      error: "Missing required headers: x-session-uri, x-chunk-start, x-total-size",
    });
  }

  // Read the raw chunk bytes (≤3 MB each → safely under Vercel's 4.5 MB limit)
  const chunkBuffer = await getRawBody(req, { limit: "4mb" });
  const chunkEnd = chunkStart + chunkBuffer.length - 1;

  console.log(
    `[UploadChunk] bytes ${chunkStart}-${chunkEnd}/${totalSize} (${chunkBuffer.length} bytes)`,
  );

  // Forward the chunk to Google Drive with the Content-Range header
  const driveRes = await fetch(sessionUri, {
    method: "PUT",
    headers: {
      "Content-Length": String(chunkBuffer.length),
      "Content-Range": `bytes ${chunkStart}-${chunkEnd}/${totalSize}`,
    },
    body: chunkBuffer,
  });

  // 308 Resume Incomplete = chunk accepted, more chunks needed
  if (driveRes.status === 308) {
    const rangeHeader = driveRes.headers.get("range");
    const uploaded = rangeHeader
      ? parseInt(rangeHeader.split("-")[1], 10) + 1
      : chunkEnd + 1;
    return res.json({ complete: false, uploaded });
  }

  // 200 or 201 = upload complete, Drive returns file metadata
  if (driveRes.ok) {
    const file = await driveRes.json();
    return res.json({
      complete: true,
      file: {
        id: file.id,
        name: file.name,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
      },
    });
  }

  // Anything else is an error
  const errText = await driveRes.text().catch(() => "");
  console.error("[UploadChunk] Drive error:", driveRes.status, errText);
  return res
    .status(500)
    .json({ error: `Drive chunk upload failed (HTTP ${driveRes.status})` });
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
