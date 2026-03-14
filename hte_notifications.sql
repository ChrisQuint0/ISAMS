
-- Batch Notifications for HTE/OJT
CREATE TABLE IF NOT EXISTS hte_notification_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiated_by_user_id UUID REFERENCES auth.users(id),
    initiated_by_name TEXT,
    student_count INTEGER NOT NULL,
    academic_year TEXT,
    semester TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hte_notification_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES hte_notification_batches(id) ON DELETE CASCADE,
    student_id TEXT, -- References the student ID used in the module
    student_name TEXT,
    student_email TEXT,
    missing_docs TEXT[], -- Array of missing document names
    sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hte_notification_cooldowns (
    student_id TEXT PRIMARY KEY,
    last_notified_at TIMESTAMPTZ NOT NULL,
    cooldown_expires_at TIMESTAMPTZ NOT NULL
);

-- Enable RLS (though usually accessed via service role)
ALTER TABLE hte_notification_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE hte_notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE hte_notification_cooldowns ENABLE ROW LEVEL SECURITY;

-- Add basic policies for admin access if needed
-- (Assuming service role is used for backend operations)
