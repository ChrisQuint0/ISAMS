/**
 * HTE Operations Handler
 * Route: /api/hte?operation=xxx
 * Operations: notify, upload, delete, download
 */
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import sgMail from "@sendgrid/mail";
import getRawBody from "raw-body";
import Busboy from "busboy";

export const config = {
  api: { bodyParser: false },
  maxDuration: 60,
};

export default async function handler(req, res) {
  const operation = req.query.operation || req.query.op;

  // If no operation specified and it's a POST, assume it's the batch notification (legacy support)
  if (!operation && req.method === "POST") {
    return handleNotify(req, res);
  }

  if (!operation) {
    return res.status(400).json({ error: "Operation parameter required" });
  }

  try {
    switch (operation) {
      case "notify":
        return handleNotify(req, res);
      case "upload":
        return handleUpload(req, res);
      case "delete":
        return handleDelete(req, res);
      case "download":
        return handleDownload(req, res);
      default:
        return res.status(404).json({ error: "Unknown operation" });
    }
  } catch (error) {
    console.error("HTE handler error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleNotify(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (!sendgridKey) {
    return res.status(500).json({ error: "SendGrid not configured" });
  }

  sgMail.setApiKey(sendgridKey);

  try {
    const rawBody = await getRawBody(req, { limit: "10mb" });
    const { batchData, actorInfo } = JSON.parse(rawBody.toString());

    if (
      !batchData ||
      !Array.isArray(batchData.students) ||
      batchData.students.length === 0
    ) {
      return res.status(400).json({ error: "Invalid batch data" });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAdmin = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // Create batch record
    const { data: batch, error: batchError } = await supabaseAdmin
      .from("hte_notification_batches")
      .insert([
        {
          initiated_by_user_id: actorInfo?.actorUserId || null,
          initiated_by_name: actorInfo?.actorName || "System",
          student_count: batchData.students.length,
          status: "processing",
        },
      ])
      .select()
      .single();

    if (batchError) {
      console.error("Failed to create batch:", batchError);
      return res
        .status(500)
        .json({ error: "Failed to create notification batch" });
    }

    const batchId = batch.id;
    const results = { sent: 0, failed: 0, errors: [] };

    // Send emails to students
    for (const student of batchData.students) {
      try {
        const msg = {
          to: student.email,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL,
            name: process.env.SENDGRID_FROM_NAME || "ISAMS",
          },
          subject: batchData.emailSubject || "HTE/OJT Notification",
          text: batchData.emailBody || "",
          html: batchData.emailBody
            ? `<p>${batchData.emailBody.replace(/\n/g, "<br>")}</p>`
            : "",
        };

        await sgMail.send(msg);

        // Record successful send
        await supabaseAdmin.from("hte_notification_logs").insert([
          {
            batch_id: batchId,
            student_name: student.fullName || student.name,
            student_email: student.email,
            status: "sent",
            sent_at: new Date().toISOString(),
          },
        ]);

        results.sent++;
      } catch (error) {
        console.error(`Failed to send email to ${student.email}:`, error);

        // Record failed send
        await supabaseAdmin.from("hte_notification_logs").insert([
          {
            batch_id: batchId,
            student_name: student.fullName || student.name,
            student_email: student.email,
            status: "failed",
            error_message: error.message,
            sent_at: new Date().toISOString(),
          },
        ]);

        results.failed++;
        results.errors.push({
          email: student.email,
          error: error.message,
        });
      }
    }

    // Update batch status
    await supabaseAdmin
      .from("hte_notification_batches")
      .update({
        status: results.failed === 0 ? "completed" : "partial",
        completed_at: new Date().toISOString(),
      })
      .eq("id", batchId);

    res.json({
      success: true,
      batchId,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error("Batch notification error:", error);
    res.status(500).json({ error: error.message });
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
    let studentId;
    let fieldId;
    let actorName;
    let actorUserId;

    busboy.on("file", (fieldname, file, info) => {
      if (fieldname === "file") {
        fileName = info.filename;
        mimeType = info.mimeType;
        const chunks = [];
        file.on("data", (data) => chunks.push(data));
        file.on("end", () => {
          fileBuffer = Buffer.concat(chunks);
        });
      }
    });

    busboy.on("field", (fieldname, val) => {
      if (fieldname === "studentId") studentId = val;
      if (fieldname === "fieldId") fieldId = val;
      if (fieldname === "actorName") actorName = val;
      if (fieldname === "actorUserId") actorUserId = val;
    });

    busboy.on("finish", async () => {
      try {
        if (!fileBuffer || !fileName) {
          res.status(400).json({ error: "No file provided" });
          return resolve();
        }

        if (!studentId || !fieldId) {
          res.status(400).json({ error: "studentId and fieldId required" });
          return resolve();
        }

        // Upload to Google Drive
        const { Readable } = await import("stream");
        const { data: file } = await drive.files.create({
          requestBody: {
            name: fileName,
            parents: [process.env.VITE_GOOGLE_DRIVE_FOLDER_ID],
          },
          media: {
            mimeType,
            body: Readable.from(fileBuffer),
          },
          fields: "id, name, webViewLink",
        });

        // Upsert into hte_document_uploads (correct pattern)
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseAdmin = createClient(
          supabaseUrl,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
        );

        const { error: upsertError } = await supabaseAdmin
          .from("hte_document_uploads")
          .upsert(
            {
              student_id: studentId,
              field_id: fieldId,
              gdrive_file_id: file.id,
              gdrive_view_link: file.webViewLink,
              original_filename: fileName,
              status: "uploaded",
              uploaded_at: new Date().toISOString(),
              uploaded_by_role: "student", // or "coordinator" if applicable
              uploaded_by_name: actorName,
            },
            { onConflict: ["student_id", "field_id"] },
          );

        if (upsertError) {
          throw new Error(upsertError.message);
        }

        res.json({
          success: true,
          fileId: file.id,
          fileName: file.name,
          webViewLink: file.webViewLink,
        });
        resolve();
      } catch (error) {
        console.error("HTE upload error:", error);
        res.status(500).json({ error: error.message });
        resolve();
      }
    });

    req.pipe(busboy);
  });
}

async function handleDelete(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawBody = await getRawBody(req, { limit: "1mb" });
    const { studentId, fieldId, actorName, actorUserId } = JSON.parse(
      rawBody.toString(),
    );

    if (!studentId || !fieldId) {
      return res.status(400).json({ error: "studentId and fieldId required" });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAdmin = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // Get current file ID from hte_document_uploads
    const { data: upload } = await supabaseAdmin
      .from("hte_document_uploads")
      .select("gdrive_file_id")
      .eq("student_id", studentId)
      .eq("field_id", fieldId)
      .maybeSingle();

    if (!upload || !upload.gdrive_file_id) {
      return res.status(404).json({ error: "File not found" });
    }
    const fileId = upload.gdrive_file_id;

    // Delete from Google Drive
    const { drive } = await getAuthClient();
    await drive.files.delete({ fileId });

    // Clear file info from hte_document_uploads
    const { error: updateError } = await supabaseAdmin
      .from("hte_document_uploads")
      .update({
        gdrive_file_id: null,
        gdrive_view_link: null,
        status: "pending",
        uploaded_at: null,
        original_filename: null,
        uploaded_by_role: null,
        uploaded_by_name: null,
      })
      .eq("student_id", studentId)
      .eq("field_id", fieldId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    res.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("HTE delete error:", error);
    res.status(500).json({ error: error.message });
  }
}

async function handleDownload(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const fileId = req.query.fileId;

  if (!fileId) {
    return res.status(400).json({ error: "fileId required" });
  }

  try {
    const { drive } = await getAuthClient();

    // Get file metadata
    const { data: metadata } = await drive.files.get({
      fileId,
      fields: "name, mimeType",
    });

    // Stream file content
    const { data: stream } = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" },
    );

    res.setHeader("Content-Type", metadata.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(metadata.name)}"`,
    );

    stream.pipe(res);
  } catch (error) {
    console.error("HTE download error:", error);
    res.status(500).json({ error: error.message });
  }
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
