/**
 * Send Email Handler
 * Sends emails using SendGrid (for reminders, notifications, etc.)
 */
import { createClient } from "@supabase/supabase-js";
import sgMail from "@sendgrid/mail";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (!sendgridKey) {
    return res.status(500).json({ error: "SendGrid not configured" });
  }

  sgMail.setApiKey(sendgridKey);

  const {
    faculty_id,
    template = "deadline_reminder",
    subject,
    message,
    pending_count,
    late_count,
  } = req.body;

  if (!faculty_id) {
    return res.status(400).json({ error: "faculty_id is required" });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get faculty info
    const { data: faculty, error: facultyError } = await supabaseAdmin
      .from("faculty_fs")
      .select("first_name, last_name, email")
      .eq("faculty_id", faculty_id)
      .single();

    if (facultyError || !faculty?.email) {
      throw new Error("Faculty not found or no email");
    }

    const facultyName = `${faculty.first_name} ${faculty.last_name}`;

    // Build email HTML
    const html = buildEmailHtml(template, {
      facultyName,
      subject,
      message,
      pendingCount: pending_count,
      lateCount: late_count,
    });

    // Send email
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@isams.edu.ph";
    const fromName = process.env.SENDGRID_FROM_NAME || "ISAMS System";

    await sgMail.send({
      to: faculty.email,
      from: { email: fromEmail, name: fromName },
      subject: html.subject,
      html: html.html,
    });

    console.log(`✅ Email sent to ${faculty.email}`);
    res.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: error.message });
  }
}

function buildEmailHtml(
  template,
  { facultyName, subject, message, pendingCount, lateCount },
) {
  const primaryColor = "#009845";
  const baseStyle = `font-family: sans-serif; background: #f8fafc; padding: 32px 16px; margin: 0;`;
  const cardStyle = `background: #ffffff; border-radius: 12px; padding: 32px; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.06);`;
  const headerStr = `
    <div style="border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 24px;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: ${primaryColor};">ISAMS</h1>
      <p style="margin: 4px 0 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8;">Institutional Submission & Monitoring System</p>
    </div>`;
  const footerStr = `
    <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">This is an automated message from ISAMS.</p>
    </div>`;

  const wrap = (body) =>
    `<div style="${baseStyle}"><div style="${cardStyle}">${headerStr}${body}${footerStr}</div></div>`;

  return {
    subject: subject || "[ISAMS] Notification",
    html: wrap(`
      <p style="font-size: 15px; color: #1e293b; margin: 0 0 12px;">Dear <strong>${facultyName}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.7;">${message || "You have pending requirements."}</p>
      ${
        pendingCount
          ? `<div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; font-weight: 700; color: #c2410c;">⚠ You have ${pendingCount} pending submission${parseInt(pendingCount) !== 1 ? "s" : ""}.</p>
        ${lateCount && parseInt(lateCount) > 0 ? `<p style="margin: 6px 0 0; font-size: 12px; color: #dc2626;">🔴 ${lateCount} item${parseInt(lateCount) !== 1 ? "s" : ""} marked as Late</p>` : ""}
      </div>`
          : ""
      }
      <p style="font-size: 14px; color: #475569;">Please log in to ISAMS to complete your submissions.</p>
    `),
  };
}
