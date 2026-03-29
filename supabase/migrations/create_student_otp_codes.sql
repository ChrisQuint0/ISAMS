-- Create the student_otp_codes table for password change OTP verification
CREATE TABLE IF NOT EXISTS student_otp_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for fast OTP lookups
CREATE INDEX IF NOT EXISTS idx_student_otp_email ON student_otp_codes(email, used, expires_at);

-- Optional: Auto-cleanup old OTPs (older than 1 hour)
-- You can run this periodically or set up a cron job
-- DELETE FROM student_otp_codes WHERE created_at < now() - interval '1 hour';
