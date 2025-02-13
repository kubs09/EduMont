-- First, drop all existing functions
DROP FUNCTION IF EXISTS initialize_admission_progress CASCADE;

-- Drop existing enums
DROP TYPE IF EXISTS user_role CASCADE;

-- Drop all existing tables in correct order
DROP TABLE IF EXISTS admission_progress CASCADE;
DROP TABLE IF EXISTS admission_requests CASCADE;
DROP TABLE IF EXISTS admission_steps CASCADE;
DROP TABLE IF EXISTS admission_terms CASCADE;
DROP TABLE IF EXISTS info_appointments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS class_history CASCADE;
DROP TABLE IF EXISTS class_children CASCADE;
DROP TABLE IF EXISTS class_teachers CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS children CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    reset_token VARCHAR(64),
    reset_token_expiry TIMESTAMP,
    message_notifications BOOLEAN DEFAULT TRUE,
    phone VARCHAR(20),
    admission_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (admission_status IN ('pending', 'in_progress', 'completed', 'rejected'))
);

CREATE TABLE children (
    id SERIAL PRIMARY KEY,
    firstname VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    parent_id INTEGER NOT NULL REFERENCES users(id),
    notes TEXT
);

CREATE TABLE invitations (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    token VARCHAR(100) UNIQUE NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    min_age INTEGER NOT NULL,
    max_age INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (min_age >= 0 AND max_age >= min_age)
);

CREATE TABLE class_teachers (
    class_id INTEGER REFERENCES classes(id),
    teacher_id INTEGER REFERENCES users(id),
    PRIMARY KEY (class_id, teacher_id)
);

CREATE TABLE class_children (
    class_id INTEGER REFERENCES classes(id),
    child_id INTEGER REFERENCES children(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed BOOLEAN DEFAULT FALSE,
    status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'denied')),
    PRIMARY KEY (class_id, child_id)
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    from_user_id INTEGER REFERENCES users(id),
    to_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    deleted_by_sender BOOLEAN DEFAULT FALSE,
    deleted_by_recipient BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_messages_from_user ON messages(from_user_id);
CREATE INDEX idx_messages_to_user ON messages(to_user_id);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(64),
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

CREATE TABLE class_history (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id),
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_class_history_class_id ON class_history(class_id);
CREATE INDEX idx_class_history_date ON class_history(date);

CREATE TABLE admission_steps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    required_documents TEXT[],
    order_index INTEGER NOT NULL UNIQUE
);

CREATE TABLE admission_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    step_id INTEGER REFERENCES admission_steps(id),
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
    admin_notes TEXT,
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id),
    documents JSONB,
    UNIQUE(user_id, step_id)
);

CREATE TABLE info_appointments (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    capacity INTEGER NOT NULL,
    online BOOLEAN NOT NULL
);

ALTER TABLE admission_progress 
ADD COLUMN IF NOT EXISTS appointment_id INTEGER REFERENCES info_appointments(id),
ADD COLUMN IF NOT EXISTS preferred_online BOOLEAN;

ALTER TABLE admission_progress
ADD COLUMN IF NOT EXISTS appointment_status VARCHAR(20) 
  DEFAULT 'pending_review' 
  CHECK (appointment_status IN ('pending_review', 'approved', 'rejected'));

-- Update existing progress entries
UPDATE admission_progress 
SET appointment_status = 'approved'
WHERE appointment_id IS NOT NULL 
AND appointment_status IS NULL;

CREATE TABLE admission_requests (
    id SERIAL PRIMARY KEY,
    firstname VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20), 
    child_firstname VARCHAR(100) NOT NULL,
    child_surname VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'invited')),
    denial_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admission_terms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample terms
INSERT INTO admission_terms (name, start_date, status) VALUES
('September 2024', '2024-09-01', 'active'),
('January 2025', '2025-01-01', 'active');

-- Add term_id to admission_progress
ALTER TABLE admission_progress
ADD COLUMN term_id INTEGER REFERENCES admission_terms(id);

-- Insert sample appointments
INSERT INTO info_appointments (date, capacity, online) VALUES
('2025-02-20 10:00:00', 5, false),
('2025-02-22 14:00:00', 5, true),
('2025-02-25 16:00:00', 5, false);

-- Insert default admission steps
INSERT INTO admission_steps (name, description, required_documents, order_index) VALUES
('Personal Information', 'Complete your personal information and contact details', ARRAY['identification', 'proof_of_address'], 1),
('Child Details', 'Provide information about your child including medical history', ARRAY['birth_certificate', 'medical_records'], 2),
('Financial Agreement', 'Review and accept financial terms and conditions', ARRAY['signed_agreement'], 3),
('Final Review', 'Admin review of all submitted documents', NULL, 4);

-- Update first admission step
UPDATE admission_steps 
SET name = 'Informational Meeting',
    description = 'Schedule an informational meeting with our staff to learn more about our program',
    required_documents = NULL,
    order_index = 1
WHERE order_index = 1;

-- Update admission steps with ON CONFLICT handling
INSERT INTO admission_steps (name, description, required_documents, order_index) VALUES
('Informational Meeting', 'Schedule an informational meeting with our staff', NULL, 1),
('Documentation', 'Upload required documents', ARRAY['birth_certificate', 'medical_records'], 2),
('Agreement', 'Review and sign agreements', ARRAY['signed_agreement'], 3),
('Final Review', 'Final review of your application', NULL, 4)
ON CONFLICT (order_index) 
DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    required_documents = EXCLUDED.required_documents;

-- Insert admin and parent users
INSERT INTO users (email, firstname, surname, password, role) VALUES
('admin@example.com', 'Admin', 'Admin', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'admin'),
('petr.novak@example.com', 'Petr', 'Novák', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'parent'),
('lucie.dvorakova@example.com', 'Lucie', 'Dvořáková', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'parent'),
('karel.svoboda@example.com', 'Karel', 'Svoboda', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'parent'),
-- Add teachers
('jana.kralova@example.com', 'Jana', 'Králová', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('martin.novotny@example.com', 'Martin', 'Novotný', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('eva.svobodova@example.com', 'Eva', 'Svobodová', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher')
ON CONFLICT (email) DO NOTHING;

-- Insert test parent with pending admission process
INSERT INTO users (email, firstname, surname, password, role, admission_status) VALUES
('test.parent@example.com', 'Test', 'Parent', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'parent', 'in_progress')
ON CONFLICT (email) DO NOTHING;

-- Initialize their admission progress for the first step (Information Meeting)
INSERT INTO admission_progress (user_id, step_id, status)
SELECT 
  u.id,
  s.id,
  'pending'
FROM users u
CROSS JOIN (SELECT id FROM admission_steps WHERE order_index = 1) s
WHERE u.email = 'test.parent@example.com'
ON CONFLICT (user_id, step_id) DO NOTHING;

-- Insert children with correct parent_id references and proper date casting
INSERT INTO children (firstname, surname, date_of_birth, parent_id, notes)
SELECT 
    'Jakub', 'Novák', DATE '2022-01-01', u.id, 'Alergie na ořechy'
FROM users u WHERE u.email = 'petr.novak@example.com'
UNION ALL
SELECT 
    'Ema', 'Dvořáková', DATE '2020-01-01', u.id, 'Bez speciálních požadavků'
FROM users u WHERE u.email = 'lucie.dvorakova@example.com'
UNION ALL
SELECT 
    'Tereza', 'Svobodová', DATE '2017-01-01', u.id, 'Vegetariánská strava'
FROM users u WHERE u.email = 'karel.svoboda@example.com';

-- Insert sample class
INSERT INTO classes (name, description, min_age, max_age) VALUES
('Morning Stars', 'Morning group for children aged 3-4', 3, 4),
('Afternoon Explorers', 'Afternoon group for children aged 4-5', 4, 5),
('Evening warriors', 'Evening group for children aged 6-10', 6, 10);

-- Assign teachers to classes
WITH teacher_ids AS (
  SELECT id, email FROM users WHERE role = 'teacher'
)
INSERT INTO class_teachers (class_id, teacher_id)
SELECT 1, id FROM teacher_ids WHERE email = 'jana.kralova@example.com'
UNION ALL
SELECT 1, id FROM teacher_ids WHERE email = 'martin.novotny@example.com'
UNION ALL
SELECT 2, id FROM teacher_ids WHERE email = 'eva.svobodova@example.com'
UNION ALL
SELECT 3, id FROM teacher_ids WHERE email = 'martin.novotny@example.com';

-- Auto-assign children to classes based on age
INSERT INTO class_children (class_id, child_id, confirmed)
SELECT 
    c.id,
    ch.id,
    TRUE
FROM children ch
CROSS JOIN LATERAL (
    SELECT id 
    FROM classes c
    WHERE EXTRACT(YEAR FROM AGE(CURRENT_DATE, ch.date_of_birth)) BETWEEN c.min_age AND c.max_age
    LIMIT 1
) c;

-- Update existing parent users to have completed admission status
UPDATE users 
SET admission_status = 'completed'
WHERE role = 'parent' 
AND email IN (
    'petr.novak@example.com',
    'lucie.dvorakova@example.com',
    'karel.svoboda@example.com'
);

-- Add a helper function to initialize admission progress
CREATE OR REPLACE FUNCTION initialize_admission_progress(user_id_param INTEGER) 
RETURNS VOID AS $$
BEGIN
  INSERT INTO admission_progress (user_id, step_id, status)
  SELECT user_id_param, id, 'pending'
  FROM admission_steps
  ORDER BY order_index
  ON CONFLICT (user_id, step_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Update the admission_progress table constraint
ALTER TABLE admission_progress 
  DROP CONSTRAINT IF EXISTS admission_progress_status_check,
  ADD CONSTRAINT admission_progress_status_check 
    CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'pending_review'));
