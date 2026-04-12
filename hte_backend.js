import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

// Load environment variables from .env.local
dotenv.config({ path: "./.env.local" });

const app = express();
const port = 3003; // Dedicated port for HTE/OJT Notifications

// Config
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL =
  process.env.SENDGRID_FROM_EMAIL || "noreply@isams.edu.ph";
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || "ISAMS System";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Middleware
app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(
    `[HTE Backend] ${new Date().toISOString()} ${req.method} ${req.url}`,
  );
  next();
});

// Supabase Admin Client
const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

// ---------- Email HTML template builder ----------
function buildHTEEmailHtml({ studentName, missingDocs }) {
  const primaryColor = "#006B35"; // CSR Green
  const baseStyle = `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f7f6; padding: 40px 20px; margin: 0;`;
  const cardStyle = `background: #ffffff; border-radius: 16px; padding: 40px; max-width: 600px; margin: 0 auto; border: 1px solid #e1e8e5; box-shadow: 0 4px 6px rgba(0,0,0,0.05);`;

  const headerStr = `
    <div style="border-bottom: 3px solid ${primaryColor}; padding-bottom: 24px; margin-bottom: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: ${primaryColor}; letter-spacing: -0.5px;">ISAMS</h1>
      <p style="margin: 6px 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #667c71;">Integrated Smart Academic Management System</p>
    </div>`;

  const footerStr = `
    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #edf2f0; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #8a9991; line-height: 1.5;">This is an automated notification from the ISAMS Thesis Archiving Module.<br/>Pamantasan ng Lungsod ng Pasig — College of Computer Studies</p>
    </div>`;

  const docsList =
    missingDocs && missingDocs.length > 0
      ? `<div style="background: #fff5f5; border: 1px solid #feb2b2; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #c53030;">Missing Requirements:</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #742a2a; line-height: 1.6;">
          ${missingDocs.map((doc) => `<li style="margin-bottom: 4px;">${doc}</li>`).join("")}
        </ul>
      </div>`
      : "";

  return `
    <div style="${baseStyle}">
      <div style="${cardStyle}">
        ${headerStr}
        
        <p style="font-size: 16px; color: #2d3748; margin: 0 0 16px;">Dear <strong>${studentName}</strong>,</p>
        
        <p style="font-size: 15px; color: #4a5568; line-height: 1.7; margin: 0 0 24px;">
          Our records show that you have pending requirements for your HTE/OJT documentation. 
          To ensure timely completion of your internship records, please settle the following:
        </p>

        ${docsList}

        <div style="background: #ebf8ff; border-left: 4px solid #3182ce; padding: 16px; border-radius: 4px; margin: 24px 0;">
          <p style="margin: 0; font-size: 14px; color: #2c5282; line-height: 1.6;">
            <strong>Action Required:</strong> Please upload your missing documents through the <strong>ISAMS Desktop App</strong>.
          </p>
        </div>

        <p style="font-size: 14px; color: #718096; line-height: 1.6;">
          If you have recently submitted these documents, please disregard this notice as it may take some time for the coordinator to review and update your status.
        </p>

        ${footerStr}
      </div>
    </div>`;
}

// ---------- Routes ----------

app.post("/api/hte/notifications/send-batch", async (req, res) => {
  if (!SENDGRID_API_KEY || !supabaseAdmin) {
    return res
      .status(500)
      .json({ error: "Email configuration or database connection missing" });
  }

  const { batchData, actorInfo } = req.body;
  if (
    !batchData ||
    !Array.isArray(batchData.students) ||
    batchData.students.length === 0
  ) {
    return res.status(400).json({ error: "Invalid batch data" });
  }

  try {
    // 1. Create Batch Record
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

    // 2. Send Emails to each student
    const recipientsToInsert = [];

    for (const student of batchData.students) {
      try {
        const html = buildHTEEmailHtml({
          studentName: student.name,
          missingDocs: student.missingDocs,
        });

        await sgMail.send({
          to: student.email,
          from: {
            email: SENDGRID_FROM_EMAIL,
            name: SENDGRID_FROM_NAME,
          },
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

        // 3. Update/Insert Cooldown
        const cooldownExpires = new Uint8Array(24); // Placeholder for logic
        // For simplicity, let's just use 24 hours from now
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

    // 4. Batch insert recipients if any
    if (recipientsToInsert.length > 0) {
      await supabaseAdmin
        .from("hte_notification_recipients")
        .insert(recipientsToInsert);
    }

    res.json({ success: true, batchId: batch.id, results });
  } catch (error) {
    console.error("Batch notification error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/hte/health", (req, res) => {
  res.json({ status: "HTE Notification Backend Running", port: 3003 });
});

app.listen(port, () => {
  console.log(`HTE Notification Backend running at http://localhost:${port}`);
});
