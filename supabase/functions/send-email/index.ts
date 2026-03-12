import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

// @ts-ignore
declare const Deno: any;

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const FROM_EMAIL = Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@isams.edu';
const FROM_NAME = Deno.env.get('SENDGRID_FROM_NAME') || 'ISAMS System';

interface PendingDoc {
  type_name: string;
  deadline_date: string | null;
  days_left: number | null;
  is_grace_period: boolean;
  hard_cutoff_date: string | null;
  days_to_cutoff: number | null;
}

function fmtDate(d: string | null): string {
  if (!d) return 'No deadline set';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildEmailHtml(template: string, data: Record<string, string>, docs: PendingDoc[]): { subject: string; html: string } {
  const { facultyName, subject, message, pendingCount, lateCount, alertType, daysToDeadline, daysToHardCutoff } = data;
  const base = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;padding:32px 16px;margin:0;`;
  const card = `background:#fff;border-radius:12px;padding:32px;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.06);`;
  const pc = '#009845';
  const header = `<div style="border-bottom:2px solid ${pc};padding-bottom:20px;margin-bottom:24px;">
      <h1 style="margin:0;font-size:22px;font-weight:800;color:${pc};">ISAMS</h1>
      <p style="margin:4px 0 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;">Institutional Submission &amp; Monitoring System</p>
    </div>`;
  const footer = `<div style="margin-top:32px;padding-top:20px;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">This is an automated message from ISAMS. Do not reply to this email.</p>
    </div>`;
  const wrap = (b: string) => `<div style="${base}"><div style="${card}">${header}${b}${footer}</div></div>`;
  const dtd = parseInt(daysToDeadline || '0');
  const dthc = parseInt(daysToHardCutoff || '0');

  if (template === 'deadline_reminder') {
    let sub = '[ISAMS] Submission Reminder — Action Required';
    let docListIntro = "This is a reminder that you have pending faculty requirement submissions that need your attention.";

    if (alertType === 'grace_period') {
      sub = `[ISAMS] 🚨 Grace Period Active — ${dthc} Day${dthc !== 1 ? 's' : ''} Until Hard Cutoff`;
      docListIntro = `Your requirements are now in the <b>Grace Period</b>. You have <b>${dthc} day${dthc !== 1 ? 's' : ''}</b> left until the hard cutoff for these files:`;
    }
    else if (alertType === 'deadline_today') {
      sub = '[ISAMS] ⏰ Deadline Today — Submit Now!';
      docListIntro = `<b>Today is the deadline</b> for your requirements. Please submit these files before midnight:`;
    }
    else if (alertType === 'upcoming' || (dtd > 0 && dtd <= 3)) {
      sub = `[ISAMS] ⏳ ${dtd} Day${dtd !== 1 ? 's' : ''} Left — Submit Your Requirements`;
      docListIntro = `You only have <b>${dtd} day${dtd !== 1 ? 's' : ''} remaining</b> for these files:`;
    }

    // Format the specific docs that match this reminder
    const docItems = docs.map(doc => {
      let docSubtext = '';
      if (alertType === 'grace_period') {
        docSubtext = `<span style="color:#dc2626;">(Hard Cutoff: ${fmtDate(doc.hard_cutoff_date)})</span>`;
      } else {
        docSubtext = `<span style="color:#64748b;">(Deadline: ${fmtDate(doc.deadline_date)})</span>`;
      }
      return `<li style="margin-bottom:8px;font-size:14px;color:#334155;"><strong>${doc.type_name}</strong> &nbsp;${docSubtext}</li>`;
    }).join("");

    return {
      subject: subject || sub,
      html: wrap(`
        <p style="font-size:15px;color:#1e293b;margin:0 0 16px;">Dear <strong>${facultyName}</strong>,</p>
        <p style="font-size:14px;color:#1e293b;line-height:1.7;">${docListIntro}</p>
        
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px 20px; margin:20px 0;">
            <ul style="margin:0; padding-left:20px;">
                ${docItems || `<li style="font-size:14px;color:#64748b;">No specific files found.</li>`}
            </ul>
        </div>
        
        ${pendingCount && parseInt(pendingCount) > 0
          ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 16px;margin:20px 0;"><p style="margin:0;font-size:13px;font-weight:700;color:#c2410c;">⚠ ${pendingCount} Total Pending Submission${parseInt(pendingCount) !== 1 ? 's' : ''} in your account</p></div>`
          : ''}
        <p style="font-size:14px;color:#475569;line-height:1.7;">Please log in to the <strong>ISAMS portal</strong> to complete your submissions.</p>`)
    };
  }

  return { subject: subject || '[ISAMS] Notification', html: wrap(`<p style="font-size:15px;color:#1e293b;">Dear <strong>${facultyName}</strong>,</p><p style="font-size:14px;color:#475569;">${message || ''}</p>`) };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });
  try {
    if (!SENDGRID_API_KEY) return Response.json({ error: 'SENDGRID_API_KEY not configured.' }, { status: 500 });
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { autoRefreshToken: false, persistSession: false } });
    const body = await req.json();
    const { faculty_id, template = 'deadline_reminder', subject, message, alert_type, days_to_deadline, days_to_hard_cutoff } = body;
    if (!faculty_id) return Response.json({ error: 'faculty_id is required' }, { status: 400 });

    const { data: faculty, error: fErr } = await supabaseAdmin.from('faculty_fs').select('first_name, last_name, email').eq('faculty_id', faculty_id).single();
    if (fErr || !faculty) return Response.json({ error: 'Faculty not found' }, { status: 404 });
    if (!faculty.email) return Response.json({ error: 'Faculty email not set' }, { status: 400 });

    const facultyName = `${faculty.first_name} ${faculty.last_name}`.trim();
    const lateCount = body.late_count?.toString() || '';
    const dtd = parseInt(days_to_deadline || '0');

    // Get the REAL total pending count from the database (across all deadlines/courses)
    const { data: totalPendingData } = await supabaseAdmin.rpc('get_faculty_total_pending', { p_faculty_id: faculty_id });
    const pendingCount = (totalPendingData ?? 0).toString();

    // Fetch pending docs with deadline info
    const { data: pendingDocs } = await supabaseAdmin.rpc('get_pending_doc_types_for_faculty', { p_faculty_id: faculty_id });
    let docs: PendingDoc[] = (pendingDocs || []) as PendingDoc[];

    // Fallback: no pending submissions in DB — fetch required docs directly with deadlines joined
    if (docs.length === 0 && parseInt(pendingCount) > 0) {
      const { data: reqDocs } = await supabaseAdmin.rpc('get_required_docs_with_deadlines');
      docs = (reqDocs || []) as PendingDoc[];
    }

    // Filter documents to match the current alert notification
    if (alert_type === 'upcoming' || alert_type === 'deadline_today') {
      docs = docs.filter(d => d.days_left === dtd);
    } else if (alert_type === 'grace_period') {
      const dthc = parseInt(days_to_hard_cutoff || '0');
      docs = docs.filter(d => d.is_grace_period && d.days_to_cutoff === dthc);
    }

    const { subject: builtSubject, html } = buildEmailHtml(template, { facultyName, subject: subject || '', message: message || '', pendingCount, lateCount, alertType: alert_type || '', daysToDeadline: days_to_deadline?.toString() || '', daysToHardCutoff: days_to_hard_cutoff?.toString() || '' }, docs);

    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ personalizations: [{ to: [{ email: faculty.email, name: facultyName }] }], from: { email: FROM_EMAIL, name: FROM_NAME }, subject: builtSubject, content: [{ type: 'text/html', value: html }] })
    });
    if (!sgRes.ok) { const e = await sgRes.text(); console.error('SendGrid error:', e); return Response.json({ error: 'SendGrid delivery failed', detail: e }, { status: 502 }); }

    await supabaseAdmin.from('notifications_fs').insert({ faculty_id, notification_type: template === 'revision_request' ? 'REVISION_REQUEST' : 'DEADLINE_REMINDER', subject: builtSubject, message: message || `Automated ${alert_type || 'reminder'} email sent to ${faculty.email}`, email_sent_at: new Date().toISOString(), email_recipient: faculty.email });
    return Response.json({ success: true, email_sent_to: faculty.email, template, alert_type: alert_type || 'manual', pending_docs: docs.map(d => d.type_name) });
  } catch (err) {
    console.error('Edge function error:', err);
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
});
