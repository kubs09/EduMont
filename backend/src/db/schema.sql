CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent');

DROP TABLE IF EXISTS users, invitations, messages, children, classes, class_teachers, class_children CASCADE;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    reset_token VARCHAR(64),
    reset_token_expiry TIMESTAMP
);

CREATE TABLE children (
    id SERIAL PRIMARY KEY,
    firstname VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    parent_id INTEGER NOT NULL REFERENCES users(id),
    contact VARCHAR(50) NOT NULL,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE class_teachers (
    class_id INTEGER REFERENCES classes(id),
    teacher_id INTEGER REFERENCES users(id),
    PRIMARY KEY (class_id, teacher_id)
);

CREATE TABLE class_children (
    class_id INTEGER REFERENCES classes(id),
    child_id INTEGER REFERENCES children(id),
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

-- Insert children with correct parent_id references and proper date casting
INSERT INTO children (firstname, surname, date_of_birth, parent_id, contact, notes)
SELECT 
    'Jakub', 'Novák', DATE '2018-01-01', u.id, 'petr.novak@example.com', 'Alergie na ořechy'
FROM users u WHERE u.email = 'petr.novak@example.com'
UNION ALL
SELECT 
    'Ema', 'Dvořáková', DATE '2019-01-01', u.id, 'lucie.dvorakova@example.com', 'Bez speciálních požadavků'
FROM users u WHERE u.email = 'lucie.dvorakova@example.com'
UNION ALL
SELECT 
    'Tereza', 'Svobodová', DATE '2017-01-01', u.id, 'karel.svoboda@example.com', 'Vegetariánská strava'
FROM users u WHERE u.email = 'karel.svoboda@example.com';

-- Insert sample class
INSERT INTO classes (name, description) VALUES
('Morning Stars', 'Morning group for children aged 3-4'),
('Afternoon Explorers', 'Afternoon group for children aged 4-5');

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
SELECT 2, id FROM teacher_ids WHERE email = 'martin.novotny@example.com';

-- Assign children to classes
WITH child_ids AS (
  SELECT ch.id, ch.firstname, p.email as parent_email
  FROM children ch
  JOIN users p ON ch.parent_id = p.id
)
INSERT INTO class_children (class_id, child_id)
SELECT 1, id FROM child_ids WHERE parent_email = 'petr.novak@example.com'  -- Jakub Novák -> Morning Stars
UNION ALL
SELECT 1, id FROM child_ids WHERE parent_email = 'lucie.dvorakova@example.com'  -- Ema Dvořáková -> Morning Stars
UNION ALL
SELECT 2, id FROM child_ids WHERE parent_email = 'karel.svoboda@example.com';  -- Tereza Svobodová -> Afternoon Explorers
