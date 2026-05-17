/**
 * HTE Notifications Handler  
 * Route: /api/hte
 * Sends batch email notifications to HTE/OJT students
 */
import { createClient } from "@supabase/supabase-js";
import sgMail from "@sendgrid/mail";
import getRawBody from "raw-body";

export const config = {
  api: { bodyParser: false },
  maxDuration: 60,
};

export default async function handler(req, res) {
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
      return res.status(500).json({ error: "Failed to create notification batch" });
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
          html: batchData.emailBody ? `<p>${batchData.emailBody.replace(/\n/g, "<br>")}</p>` : "",
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
