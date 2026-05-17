/**
 * Thesis Upload Handler
 * Route: /api/thesis/upload
 */
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import getRawBody from "raw-body";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
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
