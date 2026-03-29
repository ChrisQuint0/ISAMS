import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

// @ts-ignore
declare const Deno: any;

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const FROM_EMAIL = Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@isams.edu';
const FROM_NAME = Deno.env.get('SENDGRID_FROM_NAME') || 'ISAMS System';

interface PendingDoc {
  type_name: string;
  course_code: string;
  section: string;
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
  const facultyName = data.facultyName;
  const subject = data.subject;
  const message = data.message;
  const pendingCount = data.pendingCount;
  const pc = '#009845';

  const base = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;padding:32px 16px;margin:0;";
  const card = "background:#fff;border-radius:12px;padding:32px;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.06);";
  const header = '<div style="border-bottom:2px solid ' + pc + ';padding-bottom:20px;margin-bottom:24px;">' +
    '<h1 style="margin:0;font-size:22px;font-weight:800;color:' + pc + ';">ISAMS</h1>' +
    '<p style="margin:4px 0 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;">Institutional Submission &amp; Monitoring System</p>' +
    '</div>';
  const footer = '<div style="margin-top:32px;padding-top:20px;border-top:1px solid #f1f5f9;text-align:center;">' +
    '<p style="margin:0;font-size:11px;color:#94a3b8;">This is an automated message from ISAMS. Do not reply to this email.</p>' +
    '</div>';

  const wrap = function (b: string) { return '<div style="' + base + '"><div style="' + card + '">' + header + b + footer + '</div></div>'; };

  if (template === 'deadline_reminder') {
    const defaultSub = '[ISAMS] Action Required — Your Pending Faculty Requirements';

    // Grouping logic
    const urgentDocs = docs.filter(function (d) {
      return (d.days_left !== null && Number(d.days_left) < 0) || d.is_grace_period;
    });
    const day0Docs = docs.filter(function (d) { return !d.is_grace_period && d.days_left !== null && Number(d.days_left) === 0; });
    const day1Docs = docs.filter(function (d) { return !d.is_grace_period && d.days_left !== null && Number(d.days_left) === 1; });
    const day2Docs = docs.filter(function (d) { return !d.is_grace_period && d.days_left !== null && Number(d.days_left) === 2; });
    const day3Docs = docs.filter(function (d) { return !d.is_grace_period && d.days_left !== null && Number(d.days_left) === 3; });

    const renderGroup = function (title: string, items: PendingDoc[], color: string, badgeTxt: string) {
      if (items.length === 0) return '';
      let listHtml = '';
      for (let i = 0; i < items.length; i++) {
        const d = items[i];
        const isLate = Number(d.days_left) < 0;
        const statusText = isLate ? ' OVERDUE' : '';

        listHtml += '<li style="margin-bottom:6px;font-size:13px;color:#334155;">' +
          '<strong>' + d.type_name + '</strong>' +
          '<div style="font-size:11px;color:#64748b;margin-top:2px;">' +
          (d.course_code ? (d.course_code + ' - ' + d.section + ' &bull; ') : '') +
          'Deadline: ' + fmtDate(d.deadline_date) +
          (isLate ? ' <span style="color:#dc2626;font-weight:bold;">(LATE)</span>' : '') +
          (d.is_grace_period ? (' <br/><span style="color:#dc2626;">Hard Cutoff: ' + fmtDate(d.hard_cutoff_date) + '</span>') : '') +
          '</div>' +
          '</li>';
      }

      return '<div style="margin-bottom:24px;">' +
        '<div style="display:flex;align-items:center;margin-bottom:12px;">' +
        '<span style="background:' + color + ';color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;text-transform:uppercase;margin-right:8px;">' + badgeTxt + '</span>' +
        '<h3 style="margin:0;font-size:14px;color:#1e293b;">' + title + '</h3>' +
        '</div>' +
        '<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 16px;">' +
        '<ul style="margin:0; padding-left:20px;">' + listHtml + '</ul>' +
        '</div>' +
        '</div>';
    };

    let sections = '';
    sections += renderGroup('Urgent/Overdue Requirements', urgentDocs, '#dc2626', 'Urgent');
    sections += renderGroup('Due Today', day0Docs, '#ef4444', 'Deadline Today');
    sections += renderGroup('Due Tomorrow', day1Docs, '#f59e0b', '1 Day Left');
    sections += renderGroup('Due in 2 Days', day2Docs, '#0ea5e9', '2 Days Left');
    sections += renderGroup('Upcoming Deadlines (3 Days)', day3Docs, '#10b981', '3 Days Left');

    const pendingSummary = (pendingCount && parseInt(pendingCount) > 0)
      ? '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 16px;margin:20px 0;"><p style="margin:0;font-size:13px;font-weight:700;color:#c2410c;">⚠ You have ' + pendingCount + ' total pending submission' + (parseInt(pendingCount) !== 1 ? 's' : '') + ' in ISAMS.</p></div>'
      : '';

    const contentHtml = '<p style="font-size:15px;color:#1e293b;margin:0 0 16px;">Dear <strong>' + facultyName + '</strong>,</p>' +
      '<p style="font-size:14px;color:#1e293b;line-height:1.7;">This is a consolidated summary of your pending faculty requirements that are approaching their deadlines.</p>' +
      (sections || '<p style="font-size:14px;color:#64748b;font-style:italic;">No imminent deadlines found for the next 3 days.</p>') +
      pendingSummary +
      '<p style="font-size:14px;color:#475569;line-height:1.7;">Please log in to the <strong>ISAMS portal</strong> to complete your submissions.</p>';

    return {
      subject: subject || defaultSub,
      html: wrap(contentHtml)
    };
  }

  return {
    subject: subject || '[ISAMS] Notification',
    html: wrap('<p style="font-size:15px;color:#1e293b;">Dear <strong>' + facultyName + '</strong>,</p><p style="font-size:14px;color:#475569;">' + (message || '') + '</p>')
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });
  try {
    if (!SENDGRID_API_KEY) return Response.json({ error: 'SENDGRID_API_KEY not configured.' }, { status: 500 });
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { autoRefreshToken: false, persistSession: false } });
    const body = await req.json();
    const faculty_id = body.faculty_id;
    const template = body.template || 'deadline_reminder';
    const subject = body.subject;
    const message = body.message;
    const alert_type = body.alert_type;

    if (!faculty_id) return Response.json({ error: 'faculty_id is required' }, { status: 400 });

    const facultyRes = await supabaseAdmin.from('faculty_fs').select('first_name, last_name, email, email_reminders_enabled').eq('faculty_id', faculty_id).single();
    const faculty = facultyRes.data;
    const fErr = facultyRes.error;

    if (fErr || !faculty) return Response.json({ error: 'Faculty not found' }, { status: 404 });

    // Respect faculty preference
    if (faculty.email_reminders_enabled === false) {
      await supabaseAdmin.from('notifications_fs').insert({
        faculty_id: faculty_id,
        notification_type: template === 'revision_request' ? 'REVISION_REQUEST' : 'DEADLINE_REMINDER',
        subject: subject || 'Submission Reminder',
        message: '[SKIPPED] Automatic ' + (alert_type || 'reminder') + ' not sent due to faculty email preferences.',
        email_sent_at: new Date().toISOString(),
        email_recipient: faculty.email
      });
      return Response.json({ success: true, ignored: true, message: 'Email skipped due to faculty preference' });
    }
    if (!faculty.email) return Response.json({ error: 'Faculty email not set' }, { status: 400 });

    const facultyName = (faculty.first_name + ' ' + faculty.last_name).trim();

    // Get the REAL total pending count from the database
    const pcRes = await supabaseAdmin.rpc('get_faculty_total_pending', { p_faculty_id: faculty_id });
    const totalPendingData = pcRes.data;
    const pendingCount = (totalPendingData ?? 0).toString();

    // Fetch pending docs with deadline info
    const pdRes = await supabaseAdmin.rpc('get_pending_doc_types_for_faculty', { p_faculty_id: faculty_id });
    const pendingDocs = pdRes.data;
    let docs: PendingDoc[] = (pendingDocs || []) as PendingDoc[];

    // Filter documents for the summary:
    // - Imminent deadlines (0-3 days)
    // - Current Grace Period items (cut-off not yet reached)
    // - Overdue items (deadline passed, even if no grace period or grace passed)
    const relevantDocs = docs.filter(function (d) {
      if (d.days_left === null) return false;
      const daysLeft = Number(d.days_left);
      const daysToCutoff = Number(d.days_to_cutoff);

      return (daysLeft <= 3) ||
        (d.is_grace_period && daysToCutoff >= 0);
    });

    // If there are NO imminent/late deadlines, and this was an automated summary trigger, we can skip
    if (relevantDocs.length === 0 && alert_type === 'consolidated_summary') {
      return Response.json({ success: true, sent: false, message: 'No imminent or overdue deadlines to notify about.' });
    }

    const builtRes = buildEmailHtml(template, { facultyName: facultyName, subject: subject || '', message: message || '', pendingCount: pendingCount }, relevantDocs);

    const sgReqBody = {
      personalizations: [{ to: [{ email: faculty.email, name: facultyName }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: builtRes.subject,
      content: [{ type: 'text/html', value: builtRes.html }]
    };

    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + SENDGRID_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(sgReqBody)
    });

    if (!sgRes.ok) {
      const e = await sgRes.text();
      console.error('SendGrid error:', e);
      return Response.json({ error: 'SendGrid delivery failed', detail: e }, { status: 502 });
    }

    await supabaseAdmin.from('notifications_fs').insert({
      faculty_id: faculty_id,
      notification_type: template === 'revision_request' ? 'REVISION_REQUEST' : 'DEADLINE_REMINDER',
      subject: builtRes.subject,
      message: message || ('Automated consolidated summary email sent to ' + faculty.email),
      email_sent_at: new Date().toISOString(),
      email_recipient: faculty.email
    });

    return Response.json({ success: true, email_sent_to: faculty.email, template: template, alert_type: alert_type || 'manual', relevant_count: relevantDocs.length });
  } catch (err) {
    console.error('Edge function error:', err);
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
});
