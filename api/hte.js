/**
 * HTE Batch Notifications Handler
 * Sends batch email notifications to HTE/OJT students
 */
import { createClient } from "@supabase/supabase-js";
import sgMail from "@sendgrid/mail";
import getRawBody from "raw-body";

export const config = {
  api: { bodyParser: false },
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
          academic_year: batchData.academicYear || null,
          semester: batchData.semester || null,
        },
      ])
      .select()
      .single();

    if (batchError) throw batchError;

    const results = {
      total: batchData.students.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    const recipientsToInsert = [];
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@isams.edu.ph";
    const fromName = process.env.SENDGRID_FROM_NAME || "ISAMS System";

    for (const student of batchData.students) {
      try {
        const html = buildHTEEmailHtml({
          studentName: student.name,
          missingDocs: student.missingDocs,
        });

        await sgMail.send({
          to: student.email,
          from: { email: fromEmail, name: fromName },
          subject: "[ISAMS] HTE/OJT Document Submission Notice",
          html: html,
        });

        recipientsToInsert.push({
          batch_id: batch.id,
          student_id: student.id,
          student_name: student.name,
          student_email: student.email,
          missing_docs: student.missingDocs,
        });

        // Update cooldown
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await supabaseAdmin.from("hte_notification_cooldowns").upsert({
          student_id: student.id,
          last_notified_at: new Date().toISOString(),
          cooldown_expires_at: expiresAt.toISOString(),
        });

        results.success++;
      } catch (err) {
        console.error(`Failed to notify ${student.name}:`, err);
        results.failed++;
        results.errors.push({
          studentId: student.id,
          name: student.name,
          error: err.message,
        });
      }
    }

    // Insert recipients
    if (recipientsToInsert.length > 0) {
      await supabaseAdmin
        .from("hte_notification_recipients")
        .insert(recipientsToInsert);
    }

    res.json({ success: true, batchId: batch.id, results });
  } catch (error) {
    console.error("HTE batch error:", error);
    res.status(500).json({ error: error.message });
  }
}

function buildHTEEmailHtml({ studentName, missingDocs }) {
  const primaryColor = "#006B35";
  const baseStyle = `font-family: sans-serif; background: #f4f7f6; padding: 40px 20px; margin: 0;`;
  const cardStyle = `background: #ffffff; border-radius: 16px; padding: 40px; max-width: 600px; margin: 0 auto; border: 1px solid #e1e8e5; box-shadow: 0 4px 6px rgba(0,0,0,0.05);`;

  const headerStr = `
    <div style="border-bottom: 3px solid ${primaryColor}; padding-bottom: 24px; margin-bottom: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: ${primaryColor};">ISAMS</h1>
      <p style="margin: 6px 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #667c71;">Integrated Smart Academic Management System</p>
    </div>`;

  const footerStr = `
    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #edf2f0; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #8a9991;">This is an automated notification from ISAMS.</p>
    </div>`;

  const docsList =
    missingDocs && missingDocs.length > 0
      ? `<div style="background: #fff5f5; border: 1px solid #feb2b2; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #c53030;">Missing Requirements:</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #742a2a;">
          ${missingDocs.map((doc) => `<li>${doc}</li>`).join("")}
        </ul>
      </div>`
      : "";

  return `
    <div style="${baseStyle}">
      <div style="${cardStyle}">
        ${headerStr}
        <p style="font-size: 16px; color: #2d3748; margin: 0 0 16px;">Dear <strong>${studentName}</strong>,</p>
        <p style="font-size: 15px; color: #4a5568; line-height: 1.7;">
          Our records show that you have pending requirements for your HTE/OJT documentation. 
          Please settle the following:
        </p>
        ${docsList}
        <p style="font-size: 14px; color: #718096;">
          Please upload your missing documents through the ISAMS Desktop App.
        </p>
        ${footerStr}
      </div>
    </div>`;
}
