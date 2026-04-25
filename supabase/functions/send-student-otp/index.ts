import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

// @ts-ignore
declare const Deno: any;

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const FROM_EMAIL = Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@isams.edu';
const FROM_NAME = Deno.env.get('SENDGRID_FROM_NAME') || 'ISAMS System';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function generateOtp(): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

function buildOtpEmailHtml(studentName: string, otpCode: string): { subject: string; html: string } {
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

  const contentHtml = '<p style="font-size:15px;color:#1e293b;margin:0 0 16px;">Dear <strong>' + studentName + '</strong>,</p>' +
    '<p style="font-size:14px;color:#475569;line-height:1.7;">You have requested to change your password. Use the following OTP code to verify your identity:</p>' +
    '<div style="background:#f0fdf4;border:2px solid ' + pc + ';border-radius:12px;padding:24px;text-align:center;margin:24px 0;">' +
    '<p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#64748b;">Your Verification Code</p>' +
    '<p style="margin:0;font-size:36px;font-weight:900;letter-spacing:8px;color:' + pc + ';">' + otpCode + '</p>' +
    '</div>' +
    '<p style="font-size:13px;color:#64748b;line-height:1.7;">This code will expire in <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>';

  const html = '<div style="' + base + '"><div style="' + card + '">' + header + contentHtml + footer + '</div></div>';

  return {
    subject: '[ISAMS] Password Change Verification Code',
    html: html
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (!SENDGRID_API_KEY) {
      return json({ error: 'SENDGRID_API_KEY not configured.' }, 500);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body = await req.json();
    const student_email = body.student_email;
    const student_name = body.student_name || 'Student';

    if (!student_email) {
      return json({ error: 'student_email is required' }, 400);
    }

    // Invalidate any existing unused OTPs for this email
    await supabaseAdmin
      .from('student_otp_codes')
      .update({ used: true })
      .eq('email', student_email)
      .eq('used', false);

    // Generate new OTP
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Store OTP in database
    const { error: insertError } = await supabaseAdmin
      .from('student_otp_codes')
      .insert({
        email: student_email,
        otp_code: otpCode,
        expires_at: expiresAt,
        used: false
      });

    if (insertError) {
      console.error('Failed to store OTP:', insertError);
      return json({ error: 'Failed to generate OTP' }, 500);
    }

    // Build and send email
    const { subject, html } = buildOtpEmailHtml(student_name, otpCode);

    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + SENDGRID_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: student_email, name: student_name }] }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: subject,
        content: [{ type: 'text/html', value: html }]
      })
    });

    if (!sgRes.ok) {
      const errText = await sgRes.text();
      console.error('SendGrid error:', errText);
      return json({ error: 'Failed to send OTP email', detail: errText }, 502);
    }

    return json({ success: true, message: 'OTP sent to ' + student_email });
  } catch (err) {
    console.error('Edge function error:', err);
    return json({ error: (err as Error).message }, 500);
  }
});