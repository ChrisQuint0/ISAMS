-- ==========================================
-- 1. ENUM TYPES
-- ==========================================
CREATE TYPE offense_severity_sv AS ENUM ('Minor', 'Major', 'Compliance');
CREATE TYPE violation_status_sv AS ENUM ('Pending', 'Under Investigation', 'Sanctioned', 'Resolved', 'Dismissed');
CREATE TYPE sanction_status_sv AS ENUM ('Not Started', 'In Progress', 'Completed', 'Overdue');
CREATE TYPE sanction_type_sv AS ENUM ('Punitive', 'Preventive', 'Restitution');
CREATE TYPE student_status_sv AS ENUM ('Enrolled', 'LOA', 'Dropped', 'Expelled', 'Graduated');

-- ==========================================
-- 2. CORE ENTITIES
-- ==========================================

-- NOTE: The custom 'users' table has been REMOVED. 
-- The system will now use Supabase's built-in 'auth.users' and your existing 'public.user_rbac' table.

-- Students Table (Holds CURRENT status)
CREATE TABLE students_sv (
    student_number VARCHAR(20) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    course_year_section VARCHAR(50),
    status student_status_sv DEFAULT 'Enrolled',
    guardian_name VARCHAR(50),
    guardian_contact VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offense Catalog
CREATE TABLE offense_types_sv (
    offense_type_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- Short, clean title for dropdown menus
    description TEXT,           -- The full paragraph definition from the handbook
    severity offense_severity_sv NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. THE "SUGGESTION ENGINE"
-- ==========================================

-- Sanction Matrix (Official Handbook Rules)
CREATE TABLE sanctions_sv (
    matrix_id SERIAL PRIMARY KEY,
    severity offense_severity_sv NOT NULL,
    frequency INT NOT NULL, -- 1st, 2nd, 3rd offense
    sanction_name VARCHAR(50) NOT NULL,
    sanction_description TEXT
);

-- ==========================================
-- 4. TRANSACTION TABLES
-- ==========================================

-- Violations
CREATE TABLE violations_sv (
    violation_id SERIAL PRIMARY KEY,
    student_number VARCHAR(20) REFERENCES students_sv(student_number) ON DELETE CASCADE,
    offense_type_id INT REFERENCES offense_types_sv(offense_type_id),
    
    -- INTEGRATION POINT: References Supabase's built-in auth users table directly
    reported_by UUID REFERENCES auth.users(id),
    
    -- Snapshot Data (Crucial for Historical Accuracy)
    student_course_year_section VARCHAR(50), 
    
    -- Incident Details
    incident_date DATE NOT NULL,
    incident_time TIME NOT NULL,
    location VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Status Tracking
    status violation_status_sv DEFAULT 'Pending',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evidence / Proofs (For the Violation itself)
CREATE TABLE violation_evidence_sv (
    evidence_id SERIAL PRIMARY KEY,
    violation_id INT REFERENCES violations_sv(violation_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sanctions
CREATE TABLE student_sanctions_sv (
    sanction_id SERIAL PRIMARY KEY,
    violation_id INT UNIQUE REFERENCES violations_sv(violation_id) ON DELETE CASCADE,
    penalty_name VARCHAR(100) NOT NULL,
    description TEXT,
    type sanction_type_sv DEFAULT 'Punitive',
    status sanction_status_sv DEFAULT 'Not Started',
    start_date DATE,
    deadline_date DATE CHECK (deadline_date >= start_date),
    completion_date DATE CHECK (completion_date >= start_date),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sanction Compliance Evidence
CREATE TABLE compliance_evidence_sv (
    compliance_id SERIAL PRIMARY KEY,
    sanction_id INT REFERENCES student_sanctions_sv(sanction_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- ==========================================
-- 5. INDEXES & PERFORMANCE
-- ==========================================

CREATE INDEX idx_violations_sv_student_number ON violations_sv(student_number);
CREATE INDEX idx_violations_sv_date ON violations_sv(incident_date);
CREATE INDEX idx_violations_sv_status ON violations_sv(status);
CREATE INDEX idx_students_sv_status ON students_sv(status);

-- ==========================================
-- 8. TRIGGERS & AUTOMATION
-- ==========================================

-- Generic function to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column_sv()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the updated_at trigger to all tables that can be modified
CREATE TRIGGER set_updated_at_students_sv
BEFORE UPDATE ON students_sv
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_sv();

CREATE TRIGGER set_updated_at_offense_types_sv
BEFORE UPDATE ON offense_types_sv
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_sv();

CREATE TRIGGER set_updated_at_violations_sv
BEFORE UPDATE ON violations_sv
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_sv();

CREATE TRIGGER set_updated_at_student_sanctions_sv
BEFORE UPDATE ON student_sanctions_sv
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_sv();

-- Function to check and update violation status to 'Resolved'
CREATE OR REPLACE FUNCTION resolve_violation_sv()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when the single sanction is updated to 'Completed'
    IF NEW.status = 'Completed' THEN
        -- Directly update the main violation record to 'Resolved'
        UPDATE violations_sv 
        SET status = 'Resolved', updated_at = NOW()
        WHERE violation_id = NEW.violation_id
        AND status != 'Resolved'; -- Prevent unnecessary redundant updates
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger attached to the student_sanctions table for resolving violations
CREATE TRIGGER trigger_resolve_violation_sv
AFTER UPDATE OF status ON student_sanctions_sv
FOR EACH ROW
EXECUTE FUNCTION resolve_violation_sv();

-- NEW: Function to auto-mark violation as 'Sanctioned' when a sanction is created
CREATE OR REPLACE FUNCTION auto_mark_as_sanctioned_sv()
RETURNS TRIGGER AS $$
BEGIN
    -- When a sanction is officially created, update the parent violation status
    UPDATE violations_sv
    SET status = 'Sanctioned', updated_at = NOW()
    WHERE violation_id = NEW.violation_id
    AND status IN ('Pending', 'Under Investigation');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- NEW: Trigger attached to the student_sanctions table for initial sanctioning
CREATE TRIGGER trigger_auto_sanctioned_sv
AFTER INSERT ON student_sanctions_sv
FOR EACH ROW
EXECUTE FUNCTION auto_mark_as_sanctioned_sv();