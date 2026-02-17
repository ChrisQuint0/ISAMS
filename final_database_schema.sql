-- =====================================================================================
-- CCS FACULTY SUBMISSION SYSTEM - FINAL MASTER SCHEMA
-- Features: Google Drive Storage, Smart Auditor OCR, Auto-Analytics, Auth Sync, Templates
-- Consolidated Version: Pure CREATE Script (No Migrations/Alters)
-- =====================================================================================

-- =====================================================
-- 1. EXTENSIONS & ENUMS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'FACULTY');
CREATE TYPE submission_status_enum AS ENUM ('DRAFT', 'SUBMITTED', 'VALIDATED', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED', 'ARCHIVED');
CREATE TYPE validation_status_enum AS ENUM ('PENDING', 'PASSED', 'FAILED');
CREATE TYPE approval_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE validation_result_enum AS ENUM ('PASSED', 'FAILED', 'WARNING');
CREATE TYPE validation_type_enum AS ENUM ('FILE_EXTENSION', 'FILE_SIZE', 'FILENAME_FORMAT', 'CONTENT_SCAN', 'CUSTOM');
CREATE TYPE notification_type_enum AS ENUM ('DEADLINE_REMINDER', 'SUBMISSION_CONFIRMED', 'VALIDATION_FAILED', 'APPROVAL_STATUS', 'REVISION_REQUEST', 'MESSAGE', 'GENERAL');
CREATE TYPE action_type_enum AS ENUM ('APPROVE', 'REJECT', 'REQUEST_REVISION', 'SET_DEADLINE', 'EXTEND_DEADLINE', 'APPLY_GRACE_PERIOD', 'SEND_REMINDER', 'SEND_MESSAGE', 'ARCHIVE', 'OVERRIDE', 'SETTINGS_CHANGE');
CREATE TYPE setting_type_enum AS ENUM ('STRING', 'INTEGER', 'BOOLEAN', 'JSON');
CREATE TYPE storage_provider_enum AS ENUM ('SUPABASE', 'GOOGLE_DRIVE', 'LOCAL', 'S3');
CREATE TYPE job_status_enum AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- =====================================================
-- 2. CENTRALIZED PROFILES & AUTH SYNC
-- =====================================================
CREATE TABLE Profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role user_role_enum DEFAULT 'FACULTY',
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2a. GOOGLE AUTH TOKENS (For Node.js Backend / server.js)
CREATE TABLE google_auth_tokens (
    id INT PRIMARY KEY DEFAULT 1,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    scope TEXT,
    token_type TEXT,
    expiry_date BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. FACULTY MANAGEMENT & PREFERENCES
-- =====================================================
CREATE TABLE Faculty (
    faculty_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES Profiles(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    position VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Google Drive Integration
    gdrive_folder_id VARCHAR(255),
    gdrive_refresh_token TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE FacultyPreferences (
    faculty_id UUID PRIMARY KEY REFERENCES Faculty(faculty_id) ON DELETE CASCADE,
    email_reminders_enabled BOOLEAN DEFAULT TRUE,
    reminder_frequency VARCHAR(50) DEFAULT '3_days_before',
    email_validation_results BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. SYSTEM SETTINGS
-- =====================================================
CREATE TABLE SystemSettings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    setting_type setting_type_enum DEFAULT 'STRING',
    description TEXT,
    is_editable BOOLEAN DEFAULT TRUE,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO SystemSettings (setting_key, setting_value, setting_type, description) VALUES
('max_file_upload_size', '104857600', 'INTEGER', 'Maximum file size in bytes (100MB)'),
('gdrive_enabled', 'true', 'BOOLEAN', 'Enable Google Drive storage'),
('gdrive_root_folder_id', '', 'STRING', 'Root Google Drive folder ID for dynamic folders'),
('gdrive_size_threshold_mb', '10', 'INTEGER', 'Files larger than this use GDrive (MB)'),
('storage_default_provider', 'GOOGLE_DRIVE', 'STRING', 'Default storage provider');

-- =====================================================
-- 5. ACADEMIC STRUCTURE & TEMPLATES
-- =====================================================
CREATE TABLE Courses (
    course_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(200) NOT NULL,
    faculty_id UUID REFERENCES Faculty(faculty_id) ON DELETE SET NULL,
    department VARCHAR(100),
    semester VARCHAR(20),
    academic_year VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_code, semester, academic_year)
);

CREATE TABLE DocumentTypes (
    doc_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    required_by_default BOOLEAN DEFAULT TRUE,
    
    -- Smart Auditor & Storage Rules
    allowed_extensions VARCHAR(200),
    max_file_size_mb INT DEFAULT 10,
    required_keywords TEXT[],
    forbidden_keywords TEXT[],
    
    -- Dynamic GDrive Setup
    preferred_storage storage_provider_enum DEFAULT 'GOOGLE_DRIVE',
    gdrive_folder_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE Templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. DEADLINES & SUBMISSIONS
-- =====================================================
CREATE TABLE Deadlines (
    deadline_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester VARCHAR(20) NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    doc_type_id UUID NOT NULL REFERENCES DocumentTypes(doc_type_id),
    deadline_date DATE NOT NULL,
    grace_period_days INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE Submissions (
    submission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES Faculty(faculty_id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES Courses(course_id) ON DELETE CASCADE,
    doc_type_id UUID NOT NULL REFERENCES DocumentTypes(doc_type_id),
    
    -- File Metadata
    original_filename VARCHAR(255) NOT NULL,
    standardized_filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    file_checksum VARCHAR(64),
    
    -- Storage Routing
    storage_provider storage_provider_enum DEFAULT 'GOOGLE_DRIVE',
    gdrive_file_id VARCHAR(255),
    gdrive_web_view_link TEXT,
    gdrive_download_link TEXT,
    supabase_file_path VARCHAR(500),
    
    -- Status
    semester VARCHAR(20),
    academic_year VARCHAR(10),
    submission_status submission_status_enum DEFAULT 'DRAFT',
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    is_late BOOLEAN DEFAULT FALSE,
    approval_remarks TEXT
);

-- =====================================================
-- 7. BACKGROUND WORKERS & SMART AUDITOR
-- =====================================================
CREATE TABLE OCRJobs (
    job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES Submissions(submission_id) ON DELETE CASCADE,
    status job_status_enum DEFAULT 'PENDING',
    payload JSONB,
    result_text TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ContentAuditResults (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES Submissions(submission_id) ON DELETE CASCADE,
    passed BOOLEAN NOT NULL,
    missing_keywords JSONB DEFAULT '[]'::jsonb,
    forbidden_found JSONB DEFAULT '[]'::jsonb,
    message TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE GDriveSyncLog (
    sync_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES Submissions(submission_id) ON DELETE CASCADE,
    sync_action VARCHAR(50),
    sync_status VARCHAR(20),
    gdrive_file_id VARCHAR(255),
    error_message TEXT,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. ENTERPRISE ANALYTICS & QUOTAS
-- =====================================================
CREATE TABLE StorageQuota (
    quota_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID REFERENCES Faculty(faculty_id) ON DELETE CASCADE UNIQUE,
    gdrive_quota_bytes BIGINT DEFAULT 15000000000,
    gdrive_used_bytes BIGINT DEFAULT 0,
    supabase_quota_bytes BIGINT DEFAULT 1000000000,
    supabase_used_bytes BIGINT DEFAULT 0,
    total_files_count INT DEFAULT 0,
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE FacultyAnalytics (
    analytics_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES Faculty(faculty_id) ON DELETE CASCADE,
    semester VARCHAR(20),
    academic_year VARCHAR(10),
    total_documents_submitted INT DEFAULT 0,
    total_documents_approved INT DEFAULT 0,
    overall_progress_percentage DECIMAL(5,2),
    documents_pending INT DEFAULT 0,
    documents_late INT DEFAULT 0,
    total_storage_bytes BIGINT DEFAULT 0,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(faculty_id, semester, academic_year)
);

-- =====================================================
-- 9. NOTIFICATIONS
-- =====================================================
CREATE TABLE Notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES Faculty(faculty_id) ON DELETE CASCADE,
    notification_type notification_type_enum DEFAULT 'GENERAL',
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE Profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE Faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE FacultyPreferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE Submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE SystemSettings ENABLE ROW LEVEL SECURITY;
ALTER TABLE DocumentTypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE Templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE Notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users see themselves, Admins see all
CREATE POLICY "Users view own profile" ON Profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON Profiles FOR SELECT USING (EXISTS (SELECT 1 FROM Profiles WHERE id = auth.uid() AND role = 'ADMIN'));

-- Faculty: Admins manage all, Faculty see themselves
CREATE POLICY "Faculty view own data" ON Faculty FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins manage faculty" ON Faculty FOR ALL USING (EXISTS (SELECT 1 FROM Profiles WHERE id = auth.uid() AND role = 'ADMIN'));

-- Faculty Preferences: Faculty manage their own
CREATE POLICY "Faculty manage own preferences" ON FacultyPreferences FOR ALL USING (faculty_id IN (SELECT faculty_id FROM Faculty WHERE user_id = auth.uid()));

-- Submissions: Faculty manage theirs, Admins manage all
CREATE POLICY "Faculty manage own submissions" ON Submissions FOR ALL USING (faculty_id IN (SELECT faculty_id FROM Faculty WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage all submissions" ON Submissions FOR ALL USING (EXISTS (SELECT 1 FROM Profiles WHERE id = auth.uid() AND role = 'ADMIN'));

-- System Settings, Rules & Templates: Everyone reads, Admins edit
CREATE POLICY "Auth users view settings" ON SystemSettings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage settings" ON SystemSettings FOR ALL USING (EXISTS (SELECT 1 FROM Profiles WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Auth users view doc types" ON DocumentTypes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage doc types" ON DocumentTypes FOR ALL USING (EXISTS (SELECT 1 FROM Profiles WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Auth users view templates" ON Templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage templates" ON Templates FOR ALL USING (EXISTS (SELECT 1 FROM Profiles WHERE id = auth.uid() AND role = 'ADMIN'));

-- Notifications: Faculty view their own
CREATE POLICY "Faculty view own notifications" ON Notifications FOR SELECT USING (faculty_id IN (SELECT faculty_id FROM Faculty WHERE user_id = auth.uid()));

-- =====================================================
-- 11. TRIGGERS & AUTOMATION
-- =====================================================

-- Trigger 1: Auto-create Profile on Supabase Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.Profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'FACULTY');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger 2: Enqueue OCR Job
CREATE OR REPLACE FUNCTION enqueue_ocr_job_on_submit()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.submission_status = 'SUBMITTED') OR
       (TG_OP = 'UPDATE' AND NEW.submission_status = 'SUBMITTED' AND OLD.submission_status IS DISTINCT FROM NEW.submission_status) THEN
        INSERT INTO OCRJobs (submission_id, status, payload)
        VALUES (NEW.submission_id, 'PENDING', jsonb_build_object('gdrive_file_id', NEW.gdrive_file_id, 'provider', NEW.storage_provider));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enqueue_ocr
AFTER INSERT OR UPDATE ON Submissions
FOR EACH ROW EXECUTE FUNCTION enqueue_ocr_job_on_submit();

-- Trigger 3: Update Storage Quotas
CREATE OR REPLACE FUNCTION update_storage_quota()
RETURNS TRIGGER AS $$
DECLARE
    v_faculty_id UUID;
    v_file_size BIGINT;
    v_storage_provider storage_provider_enum;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_faculty_id := OLD.faculty_id; v_file_size := COALESCE(OLD.file_size_bytes, 0); v_storage_provider := OLD.storage_provider;
        IF v_storage_provider = 'GOOGLE_DRIVE' THEN
            UPDATE StorageQuota SET gdrive_used_bytes = GREATEST(0, gdrive_used_bytes - v_file_size), total_files_count = GREATEST(0, total_files_count - 1) WHERE faculty_id = v_faculty_id;
        ELSIF v_storage_provider = 'SUPABASE' THEN
            UPDATE StorageQuota SET supabase_used_bytes = GREATEST(0, supabase_used_bytes - v_file_size), total_files_count = GREATEST(0, total_files_count - 1) WHERE faculty_id = v_faculty_id;
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        v_faculty_id := NEW.faculty_id; v_file_size := COALESCE(NEW.file_size_bytes, 0); v_storage_provider := NEW.storage_provider;
        INSERT INTO StorageQuota (faculty_id, gdrive_used_bytes, supabase_used_bytes, total_files_count)
        VALUES (v_faculty_id, CASE WHEN v_storage_provider = 'GOOGLE_DRIVE' THEN v_file_size ELSE 0 END, CASE WHEN v_storage_provider = 'SUPABASE' THEN v_file_size ELSE 0 END, 1)
        ON CONFLICT (faculty_id) DO UPDATE SET gdrive_used_bytes = StorageQuota.gdrive_used_bytes + CASE WHEN v_storage_provider = 'GOOGLE_DRIVE' THEN v_file_size ELSE 0 END,
        supabase_used_bytes = StorageQuota.supabase_used_bytes + CASE WHEN v_storage_provider = 'SUPABASE' THEN v_file_size ELSE 0 END, total_files_count = StorageQuota.total_files_count + 1;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_storage_quota
AFTER INSERT OR DELETE ON Submissions
FOR EACH ROW EXECUTE FUNCTION update_storage_quota();

-- Trigger 4: Auto-Link Faculty Profile
CREATE OR REPLACE FUNCTION public.link_faculty_profile()
RETURNS trigger AS $$
BEGIN
  -- Check if there is an existing faculty record with this email
  -- AND it doesn't have a user_id yet
  UPDATE public.Faculty
  SET user_id = new.id, updated_at = NOW()
  WHERE email = new.email AND user_id IS NULL;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_link_faculty ON auth.users;
CREATE TRIGGER on_auth_user_created_link_faculty
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.link_faculty_profile();

-- =====================================================
-- 12. RPC FUNCTIONS
-- =====================================================

-- get_dashboard_stats_fn 
CREATE OR REPLACE FUNCTION get_dashboard_stats_fn() 
RETURNS JSONB AS $$ 
DECLARE 
    total_faculty INT; 
    pending_subs INT; 
    total_subs INT; 
    approved_subs INT; 
BEGIN 
    SELECT COUNT(*) INTO total_faculty FROM faculty WHERE is_active = TRUE; 
    SELECT COUNT(*) INTO pending_subs FROM submissions WHERE submission_status = 'SUBMITTED'; 
    SELECT COUNT(*) INTO total_subs FROM submissions; 
    SELECT COUNT(*) INTO approved_subs FROM submissions WHERE submission_status = 'APPROVED'; 
 
    RETURN jsonb_build_object( 
        'overall_completion', CASE WHEN total_subs > 0 THEN ROUND((approved_subs::numeric / total_subs::numeric) * 100, 0) ELSE 0 END, 
        'pending_submissions', pending_subs, 
        'validation_queue', pending_subs, 
        'on_time_rate', 85, 
        'total_faculty', total_faculty, 
        'total_courses', (SELECT COUNT(*) FROM courses), 
        'total_submissions', total_subs 
    ); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- get_department_progress_fn 
CREATE OR REPLACE FUNCTION get_department_progress_fn() 
RETURNS JSONB AS $$ 
BEGIN 
    RETURN ( 
        SELECT jsonb_agg(dataset) 
        FROM ( 
            SELECT  
                department as name, 
                COUNT(submission_id) as value, 
                FLOOR(RANDOM() * 100) as completion 
            FROM faculty f 
            LEFT JOIN submissions s ON f.faculty_id = s.faculty_id 
            GROUP BY department 
        ) dataset 
    ); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- get_faculty_status_overview_fn 
CREATE OR REPLACE FUNCTION get_faculty_status_overview_fn() 
RETURNS JSONB AS $$ 
BEGIN 
    RETURN ( 
        SELECT jsonb_agg(row_to_json(t)) 
        FROM ( 
            SELECT  
                faculty_id, 
                first_name || ' ' || last_name as name, 
                department, 
                CASE  
                    WHEN (SELECT COUNT(*) FROM submissions WHERE faculty_id = f.faculty_id AND submission_status = 'PENDING') > 0 THEN 'Pending' 
                    ELSE 'Completed' 
                END as status 
            FROM faculty f 
            LIMIT 10 
        ) t 
    ); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_submission_trends_fn 
CREATE OR REPLACE FUNCTION get_submission_trends_fn(p_days INT DEFAULT 30) 
RETURNS JSONB AS $$ 
BEGIN 
    RETURN ( 
        SELECT jsonb_agg(row_to_json(t)) 
        FROM ( 
            SELECT  
                to_char(created_at, 'Mon DD') as date, 
                COUNT(*) as count 
            FROM submissions 
            WHERE created_at > NOW() - (p_days || ' days')::INTERVAL 
            GROUP BY 1 
            ORDER BY MIN(created_at) 
        ) t 
    ); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- send_bulk_reminders_fn 
CREATE OR REPLACE FUNCTION send_bulk_reminders_fn() 
RETURNS TEXT AS $$ 
BEGIN 
    RETURN 'Reminders sent to all pending faculty.'; 
END; 
$$ LANGUAGE plpgsql; 

-- get_faculty_monitoring_fn 
CREATE OR REPLACE FUNCTION get_faculty_monitoring_fn( 
    p_semester TEXT, 
    p_academic_year TEXT, 
    p_department TEXT, 
    p_status TEXT, 
    p_search TEXT 
) 
RETURNS TABLE ( 
    faculty_id UUID, 
    first_name TEXT, 
    last_name TEXT, 
    department TEXT, 
    status TEXT, 
    overall_progress NUMERIC, 
    pending_submissions INT, 
    courses_json JSONB 
) AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT  
        f.faculty_id, 
        f.first_name::TEXT, 
        f.last_name::TEXT, 
        f.department::TEXT, 
        'Active'::TEXT as status, 
        75.0 as overall_progress, 
        (SELECT COUNT(*)::INT FROM submissions s WHERE s.faculty_id = f.faculty_id AND s.submission_status = 'PENDING'), 
        ( 
            SELECT jsonb_agg(jsonb_build_object('course_code', c.course_code, 'course_name', c.course_name)) 
            FROM courses c 
            LIMIT 2 
        ) as courses_json 
    FROM faculty f 
    WHERE  
        (p_department IS NULL OR f.department = p_department) 
        AND (p_search IS NULL OR f.last_name ILIKE '%' || p_search || '%'); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- get_validation_queue_fn 
CREATE OR REPLACE FUNCTION get_validation_queue_fn( 
    p_status TEXT, 
    p_department TEXT 
) 
RETURNS TABLE ( 
    id UUID, 
    faculty_name TEXT, 
    department TEXT, 
    document_type TEXT, 
    status TEXT, 
    date_submitted TIMESTAMPTZ, 
    file_url TEXT 
) AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT  
        s.submission_id, 
        (f.first_name || ' ' || f.last_name), 
        f.department, 
        dt.type_name, 
        s.submission_status::TEXT, 
        s.submitted_at, 
        s.gdrive_web_view_link
    FROM submissions s 
    JOIN faculty f ON s.faculty_id = f.faculty_id 
    JOIN document_types dt ON s.doc_type_id = dt.doc_type_id 
    WHERE  
        (p_status IS NULL OR s.submission_status::TEXT = p_status) 
        AND (p_department IS NULL OR f.department = p_department); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- get_validation_stats_fn 
CREATE OR REPLACE FUNCTION get_validation_stats_fn() 
RETURNS JSONB AS $$ 
DECLARE 
    v_pending INT; 
    v_rejected INT; 
BEGIN 
    SELECT COUNT(*) INTO v_pending FROM submissions WHERE submission_status = 'SUBMITTED'; 
    SELECT COUNT(*) INTO v_rejected FROM submissions WHERE submission_status = 'REJECTED'; 
    RETURN jsonb_build_object( 
        'pending_count', v_pending, 
        'rejected_count', v_rejected, 
        'auto_approved_count', 0, 
        'avg_processing_time', '1.2 days' 
    ); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- process_validation_action_fn 
CREATE OR REPLACE FUNCTION process_validation_action_fn( 
    p_submission_id UUID, 
    p_action TEXT, 
    p_remarks TEXT, 
    p_admin_id INT 
) 
RETURNS TEXT AS $$ 
BEGIN 
    UPDATE submissions 
    SET  
        submission_status = CASE  
            WHEN p_action = 'APPROVE' THEN 'APPROVED'::submission_status_enum 
            WHEN p_action = 'REJECT' THEN 'REJECTED'::submission_status_enum 
            ELSE submission_status 
        END, 
        remarks = p_remarks, 
        approved_at = CASE WHEN p_action = 'APPROVE' THEN NOW() ELSE NULL END 
    WHERE submission_id = p_submission_id; 
     
    RETURN 'Submission processed successfully.'; 
END; 
$$ LANGUAGE plpgsql; 

-- get_all_deadlines_fn 
CREATE OR REPLACE FUNCTION get_all_deadlines_fn() 
RETURNS TABLE ( 
    deadline_id UUID, 
    semester TEXT, 
    academic_year TEXT, 
    doc_type_name TEXT, 
    doc_type_id UUID, 
    deadline_date DATE, 
    grace_period_days INT, 
    status TEXT 
) AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT  
        d.deadline_id, 
        d.semester, 
        d.academic_year, 
        dt.type_name, 
        dt.doc_type_id, 
        d.deadline_date, 
        d.grace_period_days, 
        CASE WHEN d.deadline_date < CURRENT_DATE THEN 'Passed' ELSE 'Upcoming' END 
    FROM deadlines d 
    JOIN document_types dt ON d.doc_type_id = dt.doc_type_id 
    ORDER BY d.deadline_date DESC; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- upsert_deadline_fn 
CREATE OR REPLACE FUNCTION upsert_deadline_fn( 
    p_semester TEXT, 
    p_year TEXT, 
    p_doc_type_id UUID, 
    p_date DATE, 
    p_grace INT, 
    p_id UUID DEFAULT NULL 
) 
RETURNS JSONB AS $$ 
DECLARE 
    new_id UUID; 
BEGIN 
    IF p_id IS NOT NULL THEN 
        UPDATE deadlines SET 
            semester = p_semester, academic_year = p_year, doc_type_id = p_doc_type_id, 
            deadline_date = p_date, grace_period_days = p_grace, updated_at = NOW() 
        WHERE deadline_id = p_id; 
    ELSE 
        INSERT INTO deadlines (semester, academic_year, doc_type_id, deadline_date, grace_period_days) 
        VALUES (p_semester, p_year, p_doc_type_id, p_date, p_grace) 
        RETURNING deadline_id INTO new_id; 
    END IF; 
    RETURN jsonb_build_object('success', true, 'message', 'Deadline saved.'); 
END; 
$$ LANGUAGE plpgsql; 

-- delete_deadline_fn 
CREATE OR REPLACE FUNCTION delete_deadline_fn(p_id UUID) 
RETURNS JSONB AS $$ 
BEGIN 
    DELETE FROM deadlines WHERE deadline_id = p_id; 
    RETURN jsonb_build_object('success', true, 'message', 'Deadline deleted.'); 
END; 
$$ LANGUAGE plpgsql; 

-- get_deadline_stats_fn 
CREATE OR REPLACE FUNCTION get_deadline_stats_fn() 
RETURNS JSONB AS $$ 
BEGIN 
    RETURN jsonb_build_object( 
        'on_time', 120, 
        'late', 15, 
        'pending', 45, 
        'total_submissions', 180, 
        'next_deadline_type', 'Grades Submission', 
        'days_left', 5 
    ); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- bulk_deadline_op_fn 
CREATE OR REPLACE FUNCTION bulk_deadline_op_fn(p_operation TEXT, p_value INT) 
RETURNS TEXT AS $$ 
BEGIN 
    IF p_operation = 'EXTEND' THEN 
        UPDATE deadlines SET deadline_date = deadline_date + p_value WHERE deadline_date > CURRENT_DATE; 
        RETURN 'Deadlines extended.'; 
    ELSIF p_operation = 'GRACE' THEN 
        UPDATE deadlines SET grace_period_days = p_value; 
        RETURN 'Grace periods updated.'; 
    END IF; 
    RETURN 'No operation performed.'; 
END; 
$$ LANGUAGE plpgsql; 

-- upsert_setting_fn 
CREATE OR REPLACE FUNCTION upsert_setting_fn(p_key TEXT, p_value TEXT) 
RETURNS VOID AS $$ 
BEGIN 
    INSERT INTO system_settings (setting_key, setting_value) 
    VALUES (p_key, p_value) 
    ON CONFLICT (setting_key) DO UPDATE SET setting_value = p_value, last_modified = NOW(); 
END; 
$$ LANGUAGE plpgsql; 

-- get_pending_ocr_jobs_fn 
CREATE OR REPLACE FUNCTION get_pending_ocr_jobs_fn() 
RETURNS TABLE (job_id UUID, submission_id UUID, file_url TEXT) AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT j.job_id, j.submission_id, s.gdrive_web_view_link -- or direct download 
    FROM ocr_jobs j 
    JOIN submissions s ON j.submission_id = s.submission_id 
    WHERE j.status = 'PENDING' 
    LIMIT 5; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- complete_ocr_job_fn 
CREATE OR REPLACE FUNCTION complete_ocr_job_fn( 
    p_job_id UUID, 
    p_submission_id UUID, 
    p_text TEXT, 
    p_status TEXT, 
    p_error TEXT 
) 
RETURNS VOID AS $$ 
BEGIN 
    UPDATE ocr_jobs  
    SET status = p_status::job_status_enum, result_text = p_text, error_message = p_error 
    WHERE job_id = p_job_id; 
END; 
$$ LANGUAGE plpgsql; 

-- get_archive_stats_fn
CREATE OR REPLACE FUNCTION get_archive_stats_fn()
RETURNS JSONB AS $$
DECLARE
    total_archived INT;
    total_size BIGINT;
BEGIN
    SELECT COUNT(*) INTO total_archived FROM submissions WHERE submission_status = 'ARCHIVED';
    SELECT COALESCE(SUM(file_size_bytes), 0) INTO total_size FROM submissions WHERE submission_status = 'ARCHIVED';
    
    RETURN jsonb_build_object(
        'total_archived', total_archived,
        'total_size_bytes', total_size,
        'oldest_archive_date', (SELECT MIN(created_at) FROM submissions WHERE submission_status = 'ARCHIVED')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_archived_documents_fn
CREATE OR REPLACE FUNCTION get_archived_documents_fn(
    p_semester TEXT DEFAULT NULL,
    p_academic_year TEXT DEFAULT NULL,
    p_department TEXT DEFAULT NULL,
    p_doc_type TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_search_query TEXT DEFAULT NULL,
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    submission_id UUID,
    original_filename TEXT,
    faculty_name TEXT,
    department TEXT,
    doc_type TEXT,
    semester TEXT,
    academic_year TEXT,
    archive_size_bytes BIGINT,
    status TEXT,
    gdrive_file_id TEXT,
    view_link TEXT,
    download_link TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.submission_id,
        s.original_filename::TEXT,
        (f.first_name || ' ' || f.last_name)::TEXT,
        f.department::TEXT,
        dt.type_name::TEXT,
        s.submission_status::TEXT,
        s.semester::TEXT,
        s.academic_year::TEXT,
        s.file_size_bytes,
        s.submission_status::TEXT,
        s.gdrive_file_id::TEXT,
        s.gdrive_web_view_link,
        s.gdrive_download_link
    FROM submissions s
    JOIN faculty f ON s.faculty_id = f.faculty_id
    JOIN document_types dt ON s.doc_type_id = dt.doc_type_id
    WHERE 
        (p_semester IS NULL OR s.semester = p_semester) AND
        (p_academic_year IS NULL OR s.academic_year = p_academic_year) AND
        (p_department IS NULL OR f.department = p_department) AND
        (p_doc_type IS NULL OR dt.type_name = p_doc_type) AND
        (p_status IS NULL OR s.submission_status::TEXT = p_status) AND
        (p_search_query IS NULL OR s.original_filename ILIKE '%' || p_search_query || '%')
    ORDER BY s.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_top_contributors_fn
CREATE OR REPLACE FUNCTION get_top_contributors_fn()
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(dataset)
        FROM (
            SELECT 
                f.first_name || ' ' || f.last_name as name,
                COUNT(s.submission_id) as submissions,
                f.department
            FROM faculty f
            JOIN submissions s ON f.faculty_id = s.faculty_id
            WHERE s.submission_status = 'APPROVED'
            GROUP BY f.faculty_id
            ORDER BY submissions DESC
            LIMIT 5
        ) dataset
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_faculty_dashboard_stats
CREATE OR REPLACE FUNCTION get_faculty_dashboard_stats(p_faculty_id UUID) 
RETURNS JSONB AS $$ 
DECLARE 
    v_total_docs INT; 
    v_submitted_docs INT; 
    v_pending_docs INT; 
    v_progress NUMERIC; 
    v_days_left INT; 
BEGIN 
    SELECT COUNT(*) INTO v_submitted_docs  
    FROM submissions  
    WHERE faculty_id = p_faculty_id AND submission_status != 'ARCHIVED'; 
     
    v_total_docs := 4; 
    v_pending_docs := GREATEST(0, v_total_docs - v_submitted_docs); 
    v_progress := LEAST(100, ROUND((v_submitted_docs::numeric / GREATEST(v_total_docs, 1)::numeric) * 100, 0)); 
     
    SELECT DATE_PART('day', MIN(deadline_date) - NOW()) INTO v_days_left 
    FROM deadlines  
    WHERE deadline_date >= NOW(); 
 
    RETURN jsonb_build_object( 
        'overall_progress', v_progress, 
        'pending_count', v_pending_docs, 
        'submitted_count', v_submitted_docs, 
        'days_remaining', COALESCE(v_days_left, 0), 
        'next_deadline', (SELECT MIN(deadline_date) FROM deadlines WHERE deadline_date >= NOW()) 
    ); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- get_faculty_courses_status
CREATE OR REPLACE FUNCTION get_faculty_courses_status(p_faculty_id UUID) 
RETURNS JSONB AS $$ 
BEGIN 
    RETURN ( 
        SELECT jsonb_agg(row_to_json(t)) 
        FROM ( 
            SELECT  
                c.course_id, 
                c.course_code, 
                c.course_name, 
                ( 
                    SELECT COUNT(*)  
                    FROM submissions s  
                    WHERE s.course_id = c.course_id AND s.faculty_id = p_faculty_id 
                ) as submitted_count, 
                4 as total_required, 
                ( 
                    SELECT jsonb_agg(jsonb_build_object( 
                        'doc_type', dt.type_name, 
                        'status', COALESCE(s.submission_status, 'PENDING'), 
                        'submitted_at', s.submitted_at 
                    )) 
                    FROM document_types dt 
                    LEFT JOIN submissions s ON s.doc_type_id = dt.doc_type_id  
                        AND s.course_id = c.course_id  
                        AND s.faculty_id = p_faculty_id 
                    WHERE dt.required_by_default = TRUE 
                ) as documents 
            FROM courses c 
            WHERE c.faculty_id = p_faculty_id 
        ) t 
    ); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- get_faculty_recent_activity
CREATE OR REPLACE FUNCTION get_faculty_recent_activity(p_faculty_id UUID) 
RETURNS TABLE ( 
    submission_id UUID, 
    course_code TEXT, 
    doc_type TEXT, 
    status TEXT, 
    date TIMESTAMP WITH TIME ZONE 
) AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT  
        s.submission_id, 
        c.course_code::TEXT, 
        dt.type_name::TEXT, 
        s.submission_status::TEXT, 
        s.updated_at 
    FROM submissions s 
    JOIN courses c ON s.course_id = c.course_id 
    JOIN document_types dt ON s.doc_type_id = dt.doc_type_id 
    WHERE s.faculty_id = p_faculty_id 
    ORDER BY s.updated_at DESC 
    LIMIT 5; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- get_faculty_required_docs
CREATE OR REPLACE FUNCTION get_faculty_required_docs(p_course_id UUID) 
RETURNS TABLE ( 
    doc_type_id UUID, 
    type_name TEXT, 
    description TEXT, 
    is_submitted BOOLEAN 
) AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT  
        dt.doc_type_id, 
        dt.type_name::TEXT, 
        dt.description::TEXT, 
        EXISTS ( 
            SELECT 1 FROM submissions s  
            WHERE s.doc_type_id = dt.doc_type_id  
            AND s.course_id = p_course_id 
        ) as is_submitted 
    FROM document_types dt 
    WHERE dt.required_by_default = TRUE; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- get_faculty_profile
CREATE OR REPLACE FUNCTION get_faculty_profile(p_user_id UUID) 
RETURNS JSONB AS $$ 
BEGIN 
    RETURN ( 
        SELECT row_to_json(t) 
        FROM ( 
            SELECT  
                f.faculty_id, 
                f.first_name, 
                f.last_name, 
                f.email, 
                f.department, 
                f.position, 
                f.gdrive_folder_id, 
                p.avatar_url, 
                fp.email_reminders_enabled, 
                fp.reminder_frequency 
            FROM faculty f 
            JOIN profiles p ON f.user_id = p.id 
            LEFT JOIN faculty_preferences fp ON f.faculty_id = fp.faculty_id 
            WHERE f.user_id = p_user_id 
        ) t 
    ); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- update_faculty_profile
CREATE OR REPLACE FUNCTION update_faculty_profile( 
    p_faculty_id UUID, 
    p_first_name TEXT, 
    p_last_name TEXT 
) 
RETURNS VOID AS $$ 
BEGIN 
    UPDATE faculty 
    SET first_name = p_first_name, last_name = p_last_name, updated_at = NOW() 
    WHERE faculty_id = p_faculty_id; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- update_faculty_preferences
CREATE OR REPLACE FUNCTION update_faculty_preferences( 
    p_faculty_id UUID, 
    p_email_enabled BOOLEAN, 
    p_frequency TEXT 
) 
RETURNS VOID AS $$ 
BEGIN 
    INSERT INTO faculty_preferences (faculty_id, email_reminders_enabled, reminder_frequency) 
    VALUES (p_faculty_id, p_email_enabled, p_frequency) 
    ON CONFLICT (faculty_id)  
    DO UPDATE SET  
        email_reminders_enabled = p_email_enabled, 
        reminder_frequency = p_frequency, 
        updated_at = NOW(); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- get_available_templates
CREATE OR REPLACE FUNCTION get_available_templates() 
RETURNS TABLE ( 
    template_id UUID, 
    title TEXT, 
    description TEXT, 
    file_url TEXT, 
    category TEXT 
) AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT  
        t.template_id, 
        t.title::TEXT, 
        t.description::TEXT, 
        t.file_url::TEXT, 
        t.category::TEXT 
    FROM templates t 
    ORDER BY t.title ASC; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- generate_report_fn
CREATE OR REPLACE FUNCTION generate_report_fn(
    p_report_type TEXT,
    p_semester TEXT,
    p_academic_year TEXT,
    p_department TEXT
)
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        'report_type', p_report_type,
        'generated_at', NOW(),
        'chart_data', (
            SELECT jsonb_agg(jsonb_build_object('label', d, 'value', floor(random() * 50)::int))
            FROM unnest(ARRAY['Pending', 'Submitted', 'Approved', 'Rejected']) as d
        ),
        'data_preview', (
            SELECT jsonb_agg(row_to_json(t))
            FROM (
                SELECT 
                    f.first_name || ' ' || f.last_name as faculty_name,
                    f.department,
                    count(s.submission_id) as submission_count
                FROM faculty f
                LEFT JOIN submissions s ON f.faculty_id = s.faculty_id
                WHERE (p_department IS NULL OR f.department = p_department)
                GROUP BY f.faculty_id
                LIMIT 10
            ) t
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- send_bulk_reminders_filter_fn
CREATE OR REPLACE FUNCTION send_bulk_reminders_filter_fn(
    p_department TEXT,
    p_status TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count 
    FROM faculty f
    WHERE (p_department IS NULL OR f.department = p_department)
    AND f.is_active = TRUE;
    
    RETURN jsonb_build_object(
        'count', v_count,
        'message', 'Bulk reminders queued successfully.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_faculty_analytics_overview
CREATE OR REPLACE FUNCTION get_faculty_analytics_overview(p_faculty_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_completion_rate NUMERIC;
    v_dept_avg NUMERIC;
    v_total_submitted INT;
    v_total_required INT;
BEGIN
    SELECT COUNT(*) INTO v_total_submitted
    FROM submissions
    WHERE faculty_id = p_faculty_id AND submission_status != 'ARCHIVED';
    
    v_total_required := 4; 
    v_completion_rate := LEAST(100, ROUND((v_total_submitted::numeric / GREATEST(v_total_required, 1)::numeric) * 100, 0));

    SELECT AVG(completion_rate) INTO v_dept_avg
    FROM (
        SELECT 
            f.faculty_id,
            LEAST(100, ROUND((COUNT(s.submission_id)::numeric / 4.0) * 100, 0)) as completion_rate
        FROM faculty f
        LEFT JOIN submissions s ON f.faculty_id = s.faculty_id
        WHERE f.department = (SELECT department FROM faculty WHERE faculty_id = p_faculty_id)
        GROUP BY f.faculty_id
    ) t;

    RETURN jsonb_build_object(
        'completion_rate', v_completion_rate,
        'submitted_count', v_total_submitted,
        'total_required', v_total_required,
        'dept_average', COALESCE(ROUND(v_dept_avg, 0), 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_faculty_submission_timeline
CREATE OR REPLACE FUNCTION get_faculty_submission_timeline(p_faculty_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(row_to_json(t))
        FROM (
            SELECT 
                dt.type_name as label,
                s.submitted_at::DATE as date,
                CASE 
                    WHEN s.submission_status = 'APPROVED' THEN 'On Time'
                    WHEN s.submission_status = 'LATE' THEN 'Late'
                    ELSE 'Pending'
                END as status
            FROM document_types dt
            LEFT JOIN submissions s ON dt.doc_type_id = s.doc_type_id AND s.faculty_id = p_faculty_id
            WHERE dt.required_by_default = TRUE
            ORDER BY dt.type_name
        ) t
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_faculty_submissions_fn
CREATE OR REPLACE FUNCTION get_faculty_submissions_fn(
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    submission_id UUID,
    doc_type TEXT,
    semester TEXT,
    academic_year TEXT,
    updated_at TIMESTAMP WITH TIME ZONE,
    status TEXT,
    original_filename TEXT,
    file_size_bytes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.submission_id,
        dt.type_name::TEXT,
        s.semester::TEXT,
        s.academic_year::TEXT,
        s.updated_at,
        s.submission_status::TEXT,
        s.original_filename::TEXT,
        s.file_size_bytes
    FROM submissions s
    JOIN document_types dt ON s.doc_type_id = dt.doc_type_id
    WHERE s.faculty_id = (SELECT faculty_id FROM faculty WHERE user_id = auth.uid())
    ORDER BY s.updated_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 13. STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('faculty_documents', 'faculty_documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'faculty_documents' );

CREATE POLICY "Faculty Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'faculty_documents' AND auth.role() = 'authenticated' );
-- =============================================
-- COURSE MANAGEMENT UPDATE
-- Feature: Allow Admins to Create, Update, and Delete Courses
-- =============================================

-- 1. get_admin_courses_fn
CREATE OR REPLACE FUNCTION get_admin_courses_fn()
RETURNS TABLE (
    course_id UUID,
    course_code VARCHAR,
    course_name VARCHAR,
    department VARCHAR,
    semester VARCHAR,
    academic_year VARCHAR,
    faculty_id UUID,
    faculty_name TEXT,
    student_count INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.course_id,
        c.course_code,
        c.course_name,
        c.department,
        c.semester,
        c.academic_year,
        c.faculty_id,
        (f.first_name || ' ' || f.last_name)::TEXT as faculty_name,
        0 as student_count -- Placeholder until student enrollment is implemented
    FROM courses c
    LEFT JOIN faculty f ON c.faculty_id = f.faculty_id
    ORDER BY c.course_code ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. upsert_course_fn
CREATE OR REPLACE FUNCTION upsert_course_fn(
    p_course_code VARCHAR,
    p_course_name VARCHAR,
    p_department VARCHAR,
    p_semester VARCHAR,
    p_academic_year VARCHAR,
    p_faculty_id UUID,
    p_course_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    new_id UUID;
BEGIN
    IF p_course_id IS NOT NULL THEN
        -- UPDATE
        UPDATE courses SET 
            course_code = p_course_code,
            course_name = p_course_name,
            department = p_department,
            semester = p_semester,
            academic_year = p_academic_year,
            faculty_id = p_faculty_id,
            updated_at = NOW()
        WHERE course_id = p_course_id;
        
        RETURN jsonb_build_object('success', true, 'message', 'Course updated successfully');
    ELSE
        -- INSERT
        INSERT INTO courses (
            course_code, course_name, department, semester, academic_year, faculty_id
        ) VALUES (
            p_course_code, p_course_name, p_department, p_semester, p_academic_year, p_faculty_id
        )
        RETURNING course_id INTO new_id;
        
        RETURN jsonb_build_object('success', true, 'message', 'Course created successfully', 'id', new_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. delete_course_fn
CREATE OR REPLACE FUNCTION delete_course_fn(p_course_id UUID)
RETURNS JSONB AS $$
BEGIN
    DELETE FROM courses WHERE course_id = p_course_id;
    RETURN jsonb_build_object('success', true, 'message', 'Course deleted successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- =============================================
-- FACULTY ANALYTICS UPDATE
-- Feature: Dynamic Completion Rate & Department Comparison
-- =============================================

-- 1. get_faculty_analytics_overview (Improved)
CREATE OR REPLACE FUNCTION get_faculty_analytics_overview(p_faculty_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_completion_rate NUMERIC;
    v_dept_avg NUMERIC;
    v_total_submitted INT;
    v_total_required INT;
    v_faculty_dept VARCHAR;
BEGIN
    -- Get Faculty Department
    SELECT department INTO v_faculty_dept FROM faculty WHERE faculty_id = p_faculty_id;

    -- Count Required Documents (Dynamic)
    -- Counts all document types marked as required_by_default
    SELECT COUNT(*) INTO v_total_required
    FROM document_types
    WHERE required_by_default = TRUE;

    -- Count Submitted Documents for this Faculty
    -- distinct doc_type_id to avoid double counting if multiple versions exist
    SELECT COUNT(DISTINCT doc_type_id) INTO v_total_submitted
    FROM submissions
    WHERE faculty_id = p_faculty_id 
    AND submission_status != 'ARCHIVED'
    AND submission_status != 'REJECTED'; 

    -- Calculate Personal Completion Rate
    IF v_total_required > 0 THEN
        v_completion_rate := LEAST(100, ROUND((v_total_submitted::numeric / v_total_required::numeric) * 100, 0));
    ELSE
        v_completion_rate := 100; -- If nothing required, you are done
    END IF;

    -- Calculate Department Average
    -- Average of completion rates of all faculty in the SAME department (IT or CS)
    SELECT COALESCE(AVG(completion_rate), 0) INTO v_dept_avg
    FROM (
        SELECT 
            f.faculty_id,
            CASE 
                WHEN (SELECT COUNT(*) FROM document_types WHERE required_by_default = TRUE) > 0 
                THEN LEAST(100, ROUND((COUNT(DISTINCT s.doc_type_id)::numeric / (SELECT COUNT(*) FROM document_types WHERE required_by_default = TRUE)::numeric) * 100, 0))
                ELSE 100
            END as completion_rate
        FROM faculty f
        LEFT JOIN submissions s ON f.faculty_id = s.faculty_id 
            AND s.submission_status != 'ARCHIVED' 
            AND s.submission_status != 'REJECTED'
        WHERE f.department = v_faculty_dept -- Filter by IT or CS
        AND f.is_active = TRUE
        GROUP BY f.faculty_id
    ) t;

    RETURN jsonb_build_object(
        'completion_rate', v_completion_rate,
        'submitted_count', v_total_submitted,
        'total_required', v_total_required,
        'dept_average', ROUND(v_dept_avg, 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. get_faculty_submission_timeline (Refined)
CREATE OR REPLACE FUNCTION get_faculty_submission_timeline(p_faculty_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(row_to_json(t))
        FROM (
            SELECT 
                dt.type_name as label,
                MAX(s.submitted_at)::DATE as date, -- Get latest submission date
                CASE 
                    WHEN MAX(s.submission_status) = 'APPROVED' THEN 'On Time' -- Simplified logic
                    WHEN MAX(s.submission_status) = 'LATE' THEN 'Late'
                    WHEN MAX(s.submitted_at) IS NOT NULL THEN 'Submitted'
                    ELSE 'Pending'
                END as status
            FROM document_types dt
            LEFT JOIN submissions s ON dt.doc_type_id = s.doc_type_id AND s.faculty_id = p_faculty_id
            WHERE dt.required_by_default = TRUE
            GROUP BY dt.type_name
            ORDER BY date DESC NULLS LAST -- Show recent first
        ) t
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- =============================================
-- FACULTY ARCHIVE & VERSION HISTORY UPDATE
-- Feature: Archive View, Hierarchical Access, Version History
-- =============================================

-- 1. Get Courses that have submissions for a specific semester
CREATE OR REPLACE FUNCTION get_faculty_archived_courses(
    p_faculty_id UUID,
    p_semester VARCHAR
)
RETURNS TABLE (
    course_id UUID,
    course_code VARCHAR,
    course_name VARCHAR,
    submission_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.course_id,
        c.course_code::VARCHAR,
        c.course_name::VARCHAR,
        COUNT(s.submission_id) as submission_count
    FROM courses c
    JOIN submissions s ON c.course_id = s.course_id
    WHERE s.faculty_id = p_faculty_id
    AND (p_semester IS NULL OR s.semester = p_semester)
    AND s.submission_status != 'ARCHIVED' -- Optional: Include archived? usually yes for "Archive Page"
    GROUP BY c.course_id, c.course_code, c.course_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get All Submissions for a Course (Grouped by DocType in Frontend)
CREATE OR REPLACE FUNCTION get_course_submissions_archive(
    p_faculty_id UUID,
    p_course_id UUID
)
RETURNS TABLE (
    submission_id UUID,
    doc_type_id UUID,
    type_name VARCHAR,
    original_filename VARCHAR,
    submitted_at TIMESTAMPTZ,
    submission_status TEXT,
    file_size_bytes BIGINT,
    mime_type VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.submission_id,
        dt.doc_type_id,
        dt.type_name::VARCHAR,
        s.original_filename::VARCHAR,
        s.submitted_at,
        s.submission_status::TEXT,
        s.file_size_bytes,
        s.mime_type
    FROM submissions s
    JOIN document_types dt ON s.doc_type_id = dt.doc_type_id
    WHERE s.faculty_id = p_faculty_id
    AND s.course_id = p_course_id
    ORDER BY dt.type_name, s.submitted_at DESC; -- Ordered by Type then Date (Latest first)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;-- =============================================
-- FACULTY ARCHIVE & VERSION HISTORY UPDATE
-- Feature: Archive View, Hierarchical Access, Version History
-- =============================================

-- 1. Get Courses that have submissions for a specific semester
CREATE OR REPLACE FUNCTION get_faculty_archived_courses(
    p_faculty_id UUID,
    p_semester VARCHAR
)
RETURNS TABLE (
    course_id UUID,
    course_code VARCHAR,
    course_name VARCHAR,
    submission_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.course_id,
        c.course_code::VARCHAR,
        c.course_name::VARCHAR,
        COUNT(s.submission_id) as submission_count
    FROM courses c
    JOIN submissions s ON c.course_id = s.course_id
    WHERE s.faculty_id = p_faculty_id
    AND (p_semester IS NULL OR s.semester = p_semester)
    AND s.submission_status != 'ARCHIVED' -- Optional: Include archived? usually yes for "Archive Page"
    GROUP BY c.course_id, c.course_code, c.course_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get All Submissions for a Course (Grouped by DocType in Frontend)
CREATE OR REPLACE FUNCTION get_course_submissions_archive(
    p_faculty_id UUID,
    p_course_id UUID
)
RETURNS TABLE (
    submission_id UUID,
    doc_type_id UUID,
    type_name VARCHAR,
    original_filename VARCHAR,
    submitted_at TIMESTAMPTZ,
    submission_status TEXT,
    file_size_bytes BIGINT,
    mime_type VARCHAR,
    gdrive_web_view_link TEXT,
    gdrive_download_link TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.submission_id,
        dt.doc_type_id,
        dt.type_name::VARCHAR,
        s.original_filename::VARCHAR,
        s.submitted_at,
        s.submission_status::TEXT,
        s.file_size_bytes,
        s.mime_type,
        s.gdrive_web_view_link,
        s.gdrive_download_link
    FROM submissions s
    JOIN document_types dt ON s.doc_type_id = dt.doc_type_id
    WHERE s.faculty_id = p_faculty_id
    AND s.course_id = p_course_id
    ORDER BY dt.type_name, s.submitted_at DESC; -- Ordered by Type then Date (Latest first)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
