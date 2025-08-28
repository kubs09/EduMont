DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent');

DROP TABLE IF EXISTS class_history, users, invitations, messages, children, classes, class_teachers, class_children, schedules CASCADE;
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
    phone VARCHAR(20)
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

-- Schedule table for children's schedules
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_hours INTEGER NOT NULL CHECK (duration_hours >= 1 AND duration_hours <= 3),
    activity VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id),
    UNIQUE(child_id, date, start_time)
);

CREATE INDEX idx_schedules_child_id ON schedules(child_id);
CREATE INDEX idx_schedules_class_id ON schedules(class_id);
CREATE INDEX idx_schedules_date ON schedules(date);

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

-- Insert dummy schedule data
-- First, get admin user ID for created_by field
WITH admin_user AS (
    SELECT id FROM users WHERE role = 'admin' LIMIT 1
),
child_class_mapping AS (
    SELECT 
        ch.id as child_id,
        ch.firstname,
        ch.surname,
        cc.class_id,
        cl.name as class_name
    FROM children ch
    JOIN class_children cc ON ch.id = cc.child_id
    JOIN classes cl ON cc.class_id = cl.id
    WHERE cc.confirmed = TRUE
)
INSERT INTO schedules (child_id, class_id, date, start_time, duration_hours, activity, notes, created_by)
SELECT 
    ccm.child_id,
    ccm.class_id,
    date_val,
    start_time_val,
    duration_val,
    activity_val,
    notes_val,
    au.id
FROM child_class_mapping ccm
CROSS JOIN admin_user au
CROSS JOIN (
    VALUES 
        -- Week 1 schedules
        (DATE '2025-09-01', TIME '09:00', 2, 'Arts and Crafts', 'Drawing with crayons and paper crafts'),
        (DATE '2025-09-01', TIME '14:00', 1, 'Story Time', 'Reading fairy tales and interactive stories'),
        (DATE '2025-09-02', TIME '10:00', 2, 'Outdoor Play', 'Garden activities and nature exploration'),
        (DATE '2025-09-03', TIME '09:30', 1, 'Music and Movement', 'Singing songs and simple dance moves'),
        (DATE '2025-09-04', TIME '15:00', 2, 'Building Blocks', 'Creative construction with various blocks'),
        (DATE '2025-09-05', TIME '11:00', 1, 'Show and Tell', 'Children share their favorite toys'),
        
        -- Week 2 schedules
        (DATE '2025-09-08', TIME '09:00', 2, 'Science Fun', 'Simple experiments with water and colors'),
        (DATE '2025-09-09', TIME '14:30', 1, 'Cooking Activity', 'Making simple healthy snacks'),
        (DATE '2025-09-10', TIME '10:30', 2, 'Physical Education', 'Basic movement and coordination games'),
        (DATE '2025-09-11', TIME '09:00', 1, 'Language Learning', 'Basic vocabulary and pronunciation'),
        (DATE '2025-09-12', TIME '16:00', 2, 'Creative Drama', 'Role-playing and imagination games'),
        
        -- Week 3 schedules
        (DATE '2025-09-15', TIME '08:30', 2, 'Mathematics Fun', 'Counting games and number recognition'),
        (DATE '2025-09-16', TIME '13:00', 1, 'Art Exploration', 'Painting with brushes and finger paints'),
        (DATE '2025-09-17', TIME '10:00', 2, 'Nature Study', 'Learning about plants and animals'),
        (DATE '2025-09-18', TIME '15:30', 1, 'Puzzle Time', 'Age-appropriate jigsaw puzzles'),
        (DATE '2025-09-19', TIME '11:30', 2, 'Group Games', 'Cooperative play and team activities'),
        
        -- Week 4 schedules
        (DATE '2025-09-22', TIME '09:15', 1, 'Reading Corner', 'Independent reading and book exploration'),
        (DATE '2025-09-23', TIME '14:00', 2, 'Cultural Awareness', 'Learning about different cultures'),
        (DATE '2025-09-24', TIME '10:45', 1, 'Fine Motor Skills', 'Activities to develop hand coordination'),
        (DATE '2025-09-25', TIME '16:15', 2, 'Community Helpers', 'Learning about different professions'),
        (DATE '2025-09-26', TIME '12:00', 1, 'Celebration Day', 'Special activities and mini party')
) AS schedule_data(date_val, start_time_val, duration_val, activity_val, notes_val);
