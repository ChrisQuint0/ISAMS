import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-ignore — npm: specifier is valid in Deno runtime
import { createClient } from "npm:@supabase/supabase-js@2";

declare const Deno: any;

// ─── Environment Variables ───────────────────────────────────────────
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const FROM_EMAIL = Deno.env.get("SENDGRID_FROM_EMAIL") || "noreply@isams.edu";
const FROM_NAME = Deno.env.get("SENDGRID_FROM_NAME") || "ISAMS System";

// ─── Helpers ─────────────────────────────────────────────────────────

/** Format a date string into a human-readable format (e.g. "April 19, 2026") */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Shared HTML Pieces ──────────────────────────────────────────────

const BODY_STYLE =
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;padding:32px 16px;margin:0;";

const CARD_STYLE =
  "background:#fff;border-radius:12px;padding:32px;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;";

const HEADER_HTML = `
  <div style="border-bottom:2px solid #dc2626;padding-bottom:20px;margin-bottom:24px;">
    <h1 style="margin:0;font-size:22px;font-weight:800;color:#dc2626;">ISAMS</h1>
    <p style="margin:4px 0 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;">
      Student Violation Management System
    </p>
  </div>`;

const FOOTER_HTML = `
  <div style="margin-top:32px;padding-top:20px;border-top:1px solid #f1f5f9;text-align:center;">
    <p style="margin:0;font-size:11px;color:#94a3b8;">Automated message from ISAMS. Do not reply.</p>
  </div>`;

/** Wrap email body content with the standard layout (header + footer) */
function wrapEmail(bodyContent: string): string {
  return `<div style="${BODY_STYLE}"><div style="${CARD_STYLE}">${HEADER_HTML}${bodyContent}${FOOTER_HTML}</div></div>`;
}

/** Generate a "Dear Student Name," greeting */
function greeting(name: string): string {
  return `<p style="font-size:15px;color:#1e293b;margin:0 0 16px;">Dear <strong>${name}</strong>,</p>`;
}

// ─── Email Template Builder ──────────────────────────────────────────

/**
 * Builds the email subject and HTML body based on the event type.
 *
 * Supported event types:
 *  1. "new_violation"        – A new violation record was created
 *  2. "violation_updated"    – An existing violation's status was changed
 *  3. "violation_sanctioned" – A sanction has been imposed on a student
 *  4. "sanction_updated"     – An existing sanction's status was changed
 */
function buildEmail(
  eventType: string,
  studentName: string,
  details: Record<string, string>
): { subject: string; html: string } {
  const greet = greeting(studentName);

  // ── 1. NEW VIOLATION ─────────────────────────────────────────────
  if (eventType === "new_violation") {
    return {
      subject: "[ISAMS] Violation Recorded",
      html: wrapEmail(
        greet +
          `<p style="font-size:14px;color:#475569;margin:0 0 20px;">
            A disciplinary violation has been recorded against you.
          </p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:0 0 20px;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr>
                <td style="padding:6px 0;color:#64748b;font-weight:700;width:120px;">Offense</td>
                <td style="padding:6px 0;font-weight:600;">${details.offense_name || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#64748b;font-weight:700;">Severity</td>
                <td style="padding:6px 0;font-weight:700;">${details.severity || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#64748b;font-weight:700;">Date</td>
                <td style="padding:6px 0;">${formatDate(details.incident_date)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#64748b;font-weight:700;">Location</td>
                <td style="padding:6px 0;">${details.location || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#64748b;font-weight:700;vertical-align:top;">Description</td>
                <td style="padding:6px 0;line-height:1.5;">${details.description || "N/A"}</td>
              </tr>
            </table>
          </div>
          <p style="font-size:14px;color:#475569;">
            Please coordinate with your College Department.
          </p>`
      ),
    };
  }

  // ── 2. VIOLATION UPDATED ─────────────────────────────────────────
  if (eventType === "violation_updated") {
    const previousRow = details.old_status
      ? `<tr>
           <td style="padding:6px 0;color:#64748b;font-weight:700;">Previous</td>
           <td style="padding:6px 0;color:#94a3b8;text-decoration:line-through;">${details.old_status}</td>
         </tr>`
      : "";

    return {
      subject: "[ISAMS] Violation Status Updated",
      html: wrapEmail(
        greet +
          `<p style="font-size:14px;color:#475569;margin:0 0 20px;">
            Your violation record status has been updated.
          </p>
          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:0 0 20px;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr>
                <td style="padding:6px 0;color:#64748b;font-weight:700;width:120px;">Offense</td>
                <td style="padding:6px 0;font-weight:600;">${details.offense_name || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#64748b;font-weight:700;">New Status</td>
                <td style="padding:6px 0;font-weight:700;">${details.new_status || "N/A"}</td>
              </tr>
              ${previousRow}
            </table>
          </div>
          <p style="font-size:14px;color:#475569;">
            Contact your <strong>College Department</strong> for questions.
          </p>`
      ),
    };
  }

  // ── 3. VIOLATION SANCTIONED (sanction imposed) ───────────────────
  if (eventType === "violation_sanctioned") {
    const durationRow =
      details.start_date && details.deadline_date
        ? `<tr>
             <td style="padding:6px 0;color:#64748b;font-weight:700;">Duration</td>
             <td style="padding:6px 0;">${formatDate(details.start_date)} to ${formatDate(details.deadline_date)}</td>
           </tr>`
        : details.start_date
          ? `<tr>
               <td style="padding:6px 0;color:#64748b;font-weight:700;">Start Date</td>
               <td style="padding:6px 0;">${formatDate(details.start_date)}</td>
             </tr>`
          : "";

    const conditionsRow = details.description
      ? `<tr>
           <td style="padding:6px 0;color:#64748b;font-weight:700;vertical-align:top;">Description</td>
           <td style="padding:6px 0;line-height:1.5;">${details.description}</td>
         </tr>`
      : "";

    return {
      subject: "[ISAMS] Disciplinary Sanction Imposed",
      html: wrapEmail(
        greet +
          `<p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
            We are writing to inform you that a <strong>disciplinary sanction</strong>
            has been imposed against you in connection with a recorded violation.
          </p>

          <!-- Violation Box (Red) -->
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:0 0 16px;">
            <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:1px;">
              Violation
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr>
                <td style="padding:6px 0;color:#64748b;font-weight:700;width:130px;">Offense</td>
                <td style="padding:6px 0;font-weight:600;">${details.offense_name || "N/A"}</td>
              </tr>
            </table>
          </div>

          <!-- Sanction Details Box (Amber) -->
          <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:0 0 20px;">
            <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;">
              Sanction Details
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr>
                <td style="padding:6px 0;color:#64748b;font-weight:700;width:130px;">Sanction</td>
                <td style="padding:6px 0;font-weight:700;">${details.penalty_name || "N/A"}</td>
              </tr>
              ${durationRow}
              ${conditionsRow}
              <tr>
                <td style="padding:6px 0;color:#64748b;font-weight:700;">Status</td>
                <td style="padding:6px 0;color:#d97706;font-weight:700;">In Progress</td>
              </tr>
            </table>
          </div>

          <p style="font-size:14px;color:#475569;line-height:1.7;">
            You are required to comply with the above sanction. Please coordinate with
            your <strong>College Department</strong> immediately.
          </p>`
      ),
    };
  }

  // ── 4. SANCTION UPDATED ──────────────────────────────────────────
  if (eventType === "sanction_updated") {
    const completionRow = details.completion_date
      ? `<tr>
           <td style="padding:6px 0;color:#64748b;font-weight:700;">Completed</td>
           <td style="padding:6px 0;">${formatDate(details.completion_date)}</td>
         </tr>`
      : "";

    return {
      subject: "[ISAMS] Sanction Status Updated",
      html: wrapEmail(
        greet +
          `<p style="font-size:14px;color:#475569;margin:0 0 20px;">
            A sanction assigned to you has been updated.
          </p>
          <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:0 0 20px;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr>
                <td style="padding:6px 0;color:#64748b;font-weight:700;width:120px;">Sanction</td>
                <td style="padding:6px 0;font-weight:600;">${details.penalty_name || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#64748b;font-weight:700;">Status</td>
                <td style="padding:6px 0;font-weight:700;">${details.new_status || "N/A"}</td>
              </tr>
              ${completionRow}
            </table>
          </div>
          <p style="font-size:14px;color:#475569;">
            Contact your <strong>College Department</strong> for questions.
          </p>`
      ),
    };
  }

  // ── 5. SANCTION OVERDUE ──────────────────────────────────────────
  if (eventType === "sanction_overdue") {
    return {
      subject: "[ISAMS] URGENT: Sanction Overdue",
      html: wrapEmail(
        greet +
          `<p style="font-size:14px;color:#475569;margin:0 0 20px;">
            This is an urgent notification that a disciplinary sanction assigned to you is now <strong>OVERDUE</strong>.
          </p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:0 0 20px;">
            <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:1px;">
              Sanction Details
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr>
                <td style="padding:6px 0;color:#64748b;font-weight:700;width:120px;">Sanction</td>
                <td style="padding:6px 0;font-weight:600;">${details.penalty_name || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#64748b;font-weight:700;">Deadline</td>
                <td style="padding:6px 0;font-weight:700;color:#dc2626;">${formatDate(details.deadline_date)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#64748b;font-weight:700;">Status</td>
                <td style="padding:6px 0;font-weight:700;color:#dc2626;">OVERDUE</td>
              </tr>
            </table>
          </div>
          <p style="font-size:14px;color:#475569;">
            Failure to comply with sanctions will result in further disciplinary action. 
            Please report to your <strong>College Department</strong> immediately.
          </p>`
      ),
    };
  }

  // ── FALLBACK (unknown event type) ────────────────────────────────
  return {
    subject: "[ISAMS] Notification",
    html: wrapEmail(
      greet +
        `<p style="font-size:14px;color:#475569;">
          An update to your violation records has been made.
        </p>`
    ),
  };
}

// ─── Main Server Handler ─────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, content-type, x-client-info, apikey",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    // Validate SendGrid key is set
    if (!SENDGRID_API_KEY) {
      return Response.json(
        { error: "SENDGRID_API_KEY not set" },
        { status: 500 }
      );
    }

    // Initialize Supabase admin client (uses service role key)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Parse request body
    const body = await req.json();
    const { student_number, event_type, details } = body;

    if (!student_number || !event_type) {
      return Response.json(
        { error: "student_number and event_type are required" },
        { status: 400 }
      );
    }

    // Look up the student's name and email
    const { data: student, error: studentError } = await supabaseAdmin
      .from("students_sv")
      .select("first_name, last_name, email")
      .eq("student_number", student_number)
      .single();

    if (studentError || !student) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }

    // If the student has no email, skip sending but report success
    if (!student.email) {
      return Response.json({
        success: true,
        sent: false,
        message: "No email on file",
      });
    }

    // Build the email content
    const studentName = (student.first_name + " " + student.last_name).trim();
    const email = buildEmail(event_type, studentName, details || {});

    // Send through SendGrid
    const sendGridResponse = await fetch(
      "https://api.sendgrid.com/v3/mail/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            { to: [{ email: student.email, name: studentName }] },
          ],
          from: { email: FROM_EMAIL, name: FROM_NAME },
          subject: email.subject,
          content: [{ type: "text/html", value: email.html }],
        }),
      }
    );

    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text();
      console.error("SendGrid error:", errorText);
      return Response.json(
        { error: "SendGrid failed", detail: errorText },
        { status: 502 }
      );
    }

    return Response.json({
      success: true,
      sent: true,
      email_sent_to: student.email,
      event_type,
    });
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
});
