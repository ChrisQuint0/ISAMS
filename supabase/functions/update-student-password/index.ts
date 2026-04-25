import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

// @ts-ignore
declare const Deno: any;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info'
      }
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body = await req.json();
    const student_email = body.student_email;
    const otp = body.otp;
    const new_password = body.new_password;

    if (!student_email || !otp) {
      return Response.json({ error: 'student_email and otp are required' }, { status: 400 });
    }

    // Verify OTP: find unused, unexpired code for this email
    const now = new Date().toISOString();
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from('student_otp_codes')
      .select('*')
      .eq('email', student_email)
      .eq('otp_code', otp)
      .eq('used', false)
      .gte('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) {
      console.error('OTP lookup error:', otpError);
      return Response.json({ error: 'Failed to verify OTP' }, { status: 500 });
    }

    if (!otpRecord) {
      return Response.json({ error: 'Invalid or expired OTP. Please request a new one.' }, { status: 400 });
    }

    // If no new_password provided, this is just an OTP verification step
    if (!new_password) {
      return Response.json({ success: true, verified: true, message: 'OTP verified successfully' });
    }

    // Validate password
    if (new_password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // Find the auth user by email
    const { data: userList, error: userListError } = await supabaseAdmin.auth.admin.listUsers();
    if (userListError) {
      console.error('Failed to list users:', userListError);
      return Response.json({ error: 'Failed to find user account' }, { status: 500 });
    }

    const authUser = userList.users.find((u: any) => u.email === student_email);
    if (!authUser) {
      return Response.json({ error: 'No account found for this email' }, { status: 404 });
    }

    // Update the password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      { password: new_password }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return Response.json({ error: 'Failed to update password: ' + updateError.message }, { status: 500 });
    }

    // Mark OTP as used
    await supabaseAdmin
      .from('student_otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);

    return Response.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Edge function error:', err);
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
});
