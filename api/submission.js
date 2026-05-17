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
        return handleUpload(req, res);
      case "validate":
        return handleValidate(req, res);
      case "send-email":
        return handleSendEmail(req, res);
      case "status":
        return handleStatus(req, res);
      case "folder-rename":
        return handleFolderRename(req, res);
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

  return new Promise((resolve, reject) => {
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
          fields: "id, name, mimeType, webViewLink",
        });

        res.json({
          success: true,
          fileId: data.id,
          fileName: data.name,
          mimeType: data.mimeType,
          webViewLink: data.webViewLink,
        });
        resolve();
      } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: error.message });
        resolve();
      }
    });

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
  const { oldName, newName } = JSON.parse(rawBody.toString());

  if (!oldName || !newName) {
    return res.status(400).json({ error: "oldName and newName required" });
  }

  const { drive } = await getAuthClient();
  const query = `name='${oldName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

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
    renamedCount: renamed.length,
    folderIds: renamed,
  });
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
