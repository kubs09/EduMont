DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent');

DROP TABLE IF EXISTS class_history, class_attendance, child_excuses, users, invitations, messages, child_parents, children, classes, class_teachers, class_children, schedules, documents, category_presentations CASCADE;
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
    notes TEXT
);

CREATE TABLE child_parents (
    child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (child_id, parent_id)
);

CREATE INDEX idx_child_parents_parent_id ON child_parents(parent_id);

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
    age_group VARCHAR(50) NOT NULL,
    min_age INTEGER NOT NULL,
    max_age INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (min_age >= 0 AND max_age >= min_age),
    CHECK (age_group IN ('Infant', 'Toddler', 'Early Childhood', 'Lower Elementary', 'Upper Elementary', 'Middle School'))
);

CREATE TABLE class_teachers (
    class_id INTEGER REFERENCES classes(id),
    teacher_id INTEGER REFERENCES users(id),
    role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'assistant')),
    PRIMARY KEY (class_id, teacher_id),
    UNIQUE (class_id, role)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_class_teachers_teacher_id_unique ON class_teachers(teacher_id);

CREATE TABLE class_children (
    class_id INTEGER REFERENCES classes(id),
    child_id INTEGER REFERENCES children(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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

CREATE TABLE class_attendance (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_at TIMESTAMP,
    check_out_at TIMESTAMP,
    checked_in_by INTEGER REFERENCES users(id),
    checked_out_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (check_out_at IS NULL OR check_in_at IS NOT NULL),
    CHECK (check_out_at IS NULL OR check_out_at >= check_in_at),
    UNIQUE (class_id, child_id, attendance_date)
);

CREATE INDEX idx_class_attendance_class_date ON class_attendance(class_id, attendance_date);
CREATE INDEX idx_class_attendance_child_date ON class_attendance(child_id, attendance_date);

CREATE TABLE child_excuses (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (date_to >= date_from)
);

CREATE INDEX idx_child_excuses_child_id ON child_excuses(child_id);
CREATE INDEX idx_child_excuses_parent_id ON child_excuses(parent_id);
CREATE INDEX idx_child_excuses_date_from ON child_excuses(date_from);

-- Category presentations template - defines the order of presentations for each category and age range
CREATE TABLE category_presentations (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    age_group VARCHAR(50) NOT NULL,
    display_order INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (age_group IN ('Infant', 'Toddler', 'Early Childhood', 'Lower Elementary', 'Upper Elementary', 'Middle School')),
    UNIQUE (category, age_group, display_order)
);

CREATE INDEX idx_category_presentations_category ON category_presentations(category);
CREATE INDEX idx_category_presentations_age_group ON category_presentations(age_group);
CREATE INDEX idx_category_presentations_category_age ON category_presentations(category, age_group);

CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    display_order INTEGER DEFAULT 0,
    status VARCHAR(30) DEFAULT 'prerequisites not met' CHECK (
        status IN ('prerequisites not met', 'to be presented', 'presented', 'practiced', 'mastered')
    ),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_schedules_child_id ON schedules(child_id);
CREATE INDEX idx_schedules_class_id ON schedules(class_id);
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_schedules_category_status ON schedules(category, status);
CREATE INDEX idx_schedules_child_category ON schedules(child_id, category);

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    mime_type VARCHAR(100),
    size_bytes INTEGER CHECK (size_bytes >= 0),
    class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (class_id IS NOT NULL OR child_id IS NOT NULL)
);

CREATE INDEX idx_documents_child_id ON documents(child_id);
CREATE INDEX idx_documents_class_id ON documents(class_id);
CREATE INDEX idx_documents_created_by ON documents(created_by);

INSERT INTO users (email, firstname, surname, password, role) VALUES
('admin@example.com', 'Admin', 'Admin', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'admin'),
('petr.novak@example.com', 'Petr', 'Novák', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'parent'),
('lucie.dvorakova@example.com', 'Lucie', 'Dvořáková', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'parent'),
('karel.svoboda@example.com', 'Karel', 'Svoboda', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'parent'),
('radek.jelinek@example.com', 'Radek', 'Jelinek', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'parent'),
('lenka.stankova@example.com', 'Lenka', 'Stankova', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'parent'),
('michal.rehak@example.com', 'Michal', 'Rehak', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'parent'),
('jana.kralova@example.com', 'Jana', 'Králová', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('martin.novotny@example.com', 'Martin', 'Novotný', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('eva.svobodova@example.com', 'Eva', 'Svobodová', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('alena.malikova@example.com', 'Alena', 'Malikova', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('ondrej.kucera@example.com', 'Ondrej', 'Kucera', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('lucas.prochazka@example.com', 'Lucas', 'Prochazka', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('simona.havlova@example.com', 'Simona', 'Havlova', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('petr.horak@example.com', 'Petr', 'Horak', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('klara.benesova@example.com', 'Klara', 'Benesova', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('daniel.kolar@example.com', 'Daniel', 'Kolar', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('martina.vackova@example.com', 'Martina', 'Vackova', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('veronika.krizova@example.com', 'Veronika', 'Krizova', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('tomas.novak@example.com', 'Tomas', 'Novak', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('katerina.cerna@example.com', 'Katerina', 'Cerna', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('jakub.dvorak@example.com', 'Jakub', 'Dvorak', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('petra.holubova@example.com', 'Petra', 'Holubova', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('milan.pesek@example.com', 'Milan', 'Pesek', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('zuzana.bartova@example.com', 'Zuzana', 'Bartova', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('david.maly@example.com', 'David', 'Maly', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('lenka.novotna@example.com', 'Lenka', 'Novotna', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('michal.cerny@example.com', 'Michal', 'Cerny', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('hana.pokorova@example.com', 'Hana', 'Pokorova', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('pavel.vesely@example.com', 'Pavel', 'Vesely', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('barbora.mrazova@example.com', 'Barbora', 'Mrazova', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('jan.svoboda@example.com', 'Jan', 'Svoboda', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('tereza.adamova@example.com', 'Tereza', 'Adamova', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('lukas.nemec@example.com', 'Lukas', 'Nemec', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('anna.vlkova@example.com', 'Anna', 'Vlkova', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('radek.moravec@example.com', 'Radek', 'Moravec', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('ivana.fiala@example.com', 'Ivana', 'Fiala', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher')
ON CONFLICT (email) DO NOTHING;

INSERT INTO children (firstname, surname, date_of_birth, notes) VALUES
('Jakub', 'Novák', DATE '2022-01-01', 'Alergie na ořechy'),
('Ema', 'Dvořáková', DATE '2020-01-01', 'Bez speciálních požadavků'),
('Tereza', 'Svobodová', DATE '2017-01-01', 'Vegetariánská strava'),
('Filip', 'Jelinek', DATE '2021-05-15', 'Bez speciálních požadavků'),
('Sofie', 'Stankova', DATE '2019-03-10', 'Alergie na laktózu'),
('Adam', 'Rehak', DATE '2014-09-22', 'Bez speciálních požadavků'),
('Klara', 'Vesela', DATE '2018-11-02', 'Vegetariánská strava'),
('Matej', 'Kubik', DATE '2016-07-08', 'Alergie na ořechy'),
('Nina', 'Urbanova', DATE '2013-02-19', 'Bez speciálních požadavků');

INSERT INTO child_parents (child_id, parent_id)
SELECT ch.id, u.id
FROM children ch
JOIN users u ON (
  (ch.firstname = 'Jakub' AND u.email = 'petr.novak@example.com') OR
  (ch.firstname = 'Ema' AND u.email = 'lucie.dvorakova@example.com') OR
    (ch.firstname = 'Tereza' AND u.email = 'karel.svoboda@example.com') OR
    (ch.firstname = 'Filip' AND u.email = 'radek.jelinek@example.com') OR
    (ch.firstname = 'Sofie' AND u.email = 'lenka.stankova@example.com') OR
    (ch.firstname = 'Adam' AND u.email = 'michal.rehak@example.com') OR
    (ch.firstname = 'Klara' AND u.email = 'lenka.stankova@example.com') OR
    (ch.firstname = 'Matej' AND u.email = 'radek.jelinek@example.com') OR
    (ch.firstname = 'Nina' AND u.email = 'michal.rehak@example.com')
);

INSERT INTO classes (name, description, age_group, min_age, max_age) VALUES
-- Infant/Toddler Classes (0-3 years)
('Nido - Butterflies', 'Nido environment for infants', 'Infant', 0, 1),
('Nido - Ladybugs', 'Nido environment for infants', 'Infant', 0, 1),
('Toddler - Caterpillars', 'Toddler community for young children', 'Toddler', 1, 3),
('Toddler - Fireflies', 'Toddler community for young children', 'Toddler', 1, 3),
-- Early Childhood Classes (3-6 years)
('Early Childhood - Sunflowers', 'Early Childhood group focusing on practical life and sensorial work', 'Early Childhood', 3, 6),
('Early Childhood - Bumblebees', 'Early Childhood group with emphasis on language and mathematics', 'Early Childhood', 3, 6),
('Early Childhood - Daisies', 'Early Childhood group for mixed-age learning', 'Early Childhood', 3, 6),
-- Lower Elementary Classes (6-9 years)
('Lower Elementary - Explorers', 'Lower Elementary group for cosmic education and research', 'Lower Elementary', 6, 9),
('Lower Elementary - Inventors', 'Lower Elementary group focusing on science and mathematics', 'Lower Elementary', 6, 9),
('Lower Elementary - Discoverers', 'Lower Elementary group with arts integration', 'Lower Elementary', 6, 9),
-- Upper Elementary Classes (9-12 years)
('Upper Elementary - Trailblazers', 'Upper Elementary group for advanced studies', 'Upper Elementary', 9, 12),
('Upper Elementary - Navigators', 'Upper Elementary group with STEM focus', 'Upper Elementary', 9, 12),
('Upper Elementary - Pioneers', 'Upper Elementary group emphasizing leadership', 'Upper Elementary', 9, 12),
-- Middle School Classes (12-15 years)
('Middle School - Scholars', 'Middle School community for adolescent program', 'Middle School', 12, 15),
('Middle School - Innovators', 'Middle School community with entrepreneurship focus', 'Middle School', 12, 15);

WITH teacher_ids AS (
  SELECT id, email FROM users WHERE role = 'teacher'
)
INSERT INTO class_teachers (class_id, teacher_id, role)
-- Infant Classes (1-2)
SELECT 1, id, 'teacher' FROM teacher_ids WHERE email = 'jana.kralova@example.com'
UNION ALL
SELECT 1, id, 'assistant' FROM teacher_ids WHERE email = 'alena.malikova@example.com'
UNION ALL
SELECT 2, id, 'teacher' FROM teacher_ids WHERE email = 'martin.novotny@example.com'
UNION ALL
SELECT 2, id, 'assistant' FROM teacher_ids WHERE email = 'ondrej.kucera@example.com'
UNION ALL
-- Toddler Classes (3-4)
SELECT 3, id, 'teacher' FROM teacher_ids WHERE email = 'eva.svobodova@example.com'
UNION ALL
SELECT 3, id, 'assistant' FROM teacher_ids WHERE email = 'lucas.prochazka@example.com'
UNION ALL
SELECT 4, id, 'teacher' FROM teacher_ids WHERE email = 'simona.havlova@example.com'
UNION ALL
SELECT 4, id, 'assistant' FROM teacher_ids WHERE email = 'petr.horak@example.com'
UNION ALL
-- Early Childhood Classes (5-7)
SELECT 5, id, 'teacher' FROM teacher_ids WHERE email = 'klara.benesova@example.com'
UNION ALL
SELECT 5, id, 'assistant' FROM teacher_ids WHERE email = 'daniel.kolar@example.com'
UNION ALL
SELECT 6, id, 'teacher' FROM teacher_ids WHERE email = 'martina.vackova@example.com'
UNION ALL
SELECT 6, id, 'assistant' FROM teacher_ids WHERE email = 'veronika.krizova@example.com'
UNION ALL
SELECT 7, id, 'teacher' FROM teacher_ids WHERE email = 'tomas.novak@example.com'
UNION ALL
SELECT 7, id, 'assistant' FROM teacher_ids WHERE email = 'katerina.cerna@example.com'
UNION ALL
-- Lower Elementary Classes (8-10)
SELECT 8, id, 'teacher' FROM teacher_ids WHERE email = 'jakub.dvorak@example.com'
UNION ALL
SELECT 8, id, 'assistant' FROM teacher_ids WHERE email = 'petra.holubova@example.com'
UNION ALL
SELECT 9, id, 'teacher' FROM teacher_ids WHERE email = 'milan.pesek@example.com'
UNION ALL
SELECT 9, id, 'assistant' FROM teacher_ids WHERE email = 'zuzana.bartova@example.com'
UNION ALL
SELECT 10, id, 'teacher' FROM teacher_ids WHERE email = 'david.maly@example.com'
UNION ALL
SELECT 10, id, 'assistant' FROM teacher_ids WHERE email = 'lenka.novotna@example.com'
UNION ALL
-- Upper Elementary Classes (11-13)
SELECT 11, id, 'teacher' FROM teacher_ids WHERE email = 'michal.cerny@example.com'
UNION ALL
SELECT 11, id, 'assistant' FROM teacher_ids WHERE email = 'hana.pokorova@example.com'
UNION ALL
SELECT 12, id, 'teacher' FROM teacher_ids WHERE email = 'pavel.vesely@example.com'
UNION ALL
SELECT 12, id, 'assistant' FROM teacher_ids WHERE email = 'barbora.mrazova@example.com'
UNION ALL
SELECT 13, id, 'teacher' FROM teacher_ids WHERE email = 'jan.svoboda@example.com'
UNION ALL
SELECT 13, id, 'assistant' FROM teacher_ids WHERE email = 'tereza.adamova@example.com'
UNION ALL
-- Middle School Classes (14-15)
SELECT 14, id, 'teacher' FROM teacher_ids WHERE email = 'lukas.nemec@example.com'
UNION ALL
SELECT 14, id, 'assistant' FROM teacher_ids WHERE email = 'anna.vlkova@example.com'
UNION ALL
SELECT 15, id, 'teacher' FROM teacher_ids WHERE email = 'radek.moravec@example.com'
UNION ALL
SELECT 15, id, 'assistant' FROM teacher_ids WHERE email = 'ivana.fiala@example.com';

INSERT INTO class_children (class_id, child_id)
SELECT 
    c.id,
    ch.id
FROM children ch
CROSS JOIN LATERAL (
    SELECT id 
    FROM classes c
    WHERE EXTRACT(YEAR FROM AGE(CURRENT_DATE, ch.date_of_birth)) BETWEEN c.min_age AND c.max_age
    LIMIT 1
) c;

INSERT INTO category_presentations (category, name, age_group, display_order, notes)
VALUES 
    -- Infant (0-1 years) - Fundamental Categories
    ('Practical Life', 'Grasping Objects', 'Infant', 1, 'Practice reaching and grasping'),
    ('Practical Life', 'Assisted Sitting', 'Infant', 2, 'Work on sitting balance'),
    ('Sensorial', 'Visual Tracking', 'Infant', 1, 'Track moving objects with eyes'),
    ('Sensorial', 'Tactile Exploration', 'Infant', 2, 'Explore textures with hands'),
    ('Language', 'Sound Awareness', 'Infant', 1, 'Respond to sounds and voices'),
    ('Language', 'Babbling', 'Infant', 2, 'Practice vocal sounds'),
    ('Mathematics', 'Object Permanence', 'Infant', 1, 'Understanding objects exist when hidden'),
    ('Culture', 'Face Recognition', 'Infant', 1, 'Recognize familiar faces'),
    
    -- Toddler (1-3 years) - Same categories, age-appropriate content
    ('Practical Life', 'Pouring Water', 'Toddler', 1, 'Pour from pitcher to cup'),
    ('Practical Life', 'Buttoning Frames', 'Toddler', 2, 'Practice buttoning clothing'),
    ('Practical Life', 'Hand Washing', 'Toddler', 3, 'Independent hand washing routine'),
    ('Sensorial', 'Size Sorting', 'Toddler', 1, 'Sort objects by size'),
    ('Sensorial', 'Color Matching', 'Toddler', 2, 'Match primary colors'),
    ('Sensorial', 'Texture Cards', 'Toddler', 3, 'Match rough and smooth textures'),
    ('Mathematics', 'Counting 1-5', 'Toddler', 1, 'Count objects up to 5'),
    ('Mathematics', 'Shape Recognition', 'Toddler', 2, 'Identify circle, square, triangle'),
    ('Culture', 'Animal Recognition', 'Toddler', 1, 'Identify common animals'),
    ('Culture', 'Simple Songs', 'Toddler', 2, 'Learn nursery rhymes'),
    ('Language', 'Vocabulary Building', 'Toddler', 1, 'Learn names of familiar objects'),
    ('Language', 'Two-Word Phrases', 'Toddler', 2, 'Combine two words in speech'),
    
    -- Early Childhood (3-6 years) - Same categories, more complex
    ('Practical Life', 'Pouring and Transferring', 'Early Childhood', 1, 'Transfer beans using spoon'),
    ('Practical Life', 'Buttoning and Zipping', 'Early Childhood', 2, 'Complete dressing frames'),
    ('Practical Life', 'Table Setting', 'Early Childhood', 3, 'Set table for snack'),
    ('Practical Life', 'Grace and Courtesy', 'Early Childhood', 4, 'Practice polite interactions'),
    ('Sensorial', 'Pink Tower', 'Early Childhood', 1, 'Build tower by size'),
    ('Sensorial', 'Brown Stair', 'Early Childhood', 2, 'Order blocks by width'),
    ('Sensorial', 'Color Tablets Box 1', 'Early Childhood', 3, 'Match primary colors'),
    ('Sensorial', 'Sound Cylinders', 'Early Childhood', 4, 'Match sounds by volume'),
    ('Mathematics', 'Number Rods', 'Early Childhood', 1, 'Understand quantity 1-10'),
    ('Mathematics', 'Sandpaper Numbers', 'Early Childhood', 2, 'Trace and recognize numerals 0-9'),
    ('Mathematics', 'Spindle Box', 'Early Childhood', 3, 'Associate quantity with numeral'),
    ('Mathematics', 'Golden Beads', 'Early Childhood', 4, 'Introduction to decimal system'),
    ('Culture', 'Land and Water Forms', 'Early Childhood', 1, 'Recognize geographic landforms'),
    ('Culture', 'Puzzle Maps', 'Early Childhood', 2, 'Identify continents'),
    ('Culture', 'Botany Cabinet', 'Early Childhood', 3, 'Learn leaf shapes'),
    ('Culture', 'Zoology Puzzles', 'Early Childhood', 4, 'Study animal parts'),
    ('Language', 'Sandpaper Letters', 'Early Childhood', 1, 'Learn letter sounds'),
    ('Language', 'Moveable Alphabet', 'Early Childhood', 2, 'Build simple words'),
    ('Language', 'Object Box', 'Early Childhood', 3, 'Match objects to words'),
    ('Language', 'Reading Classification', 'Early Childhood', 4, 'Read and classify words'),
    
    -- Lower Elementary (6-9 years) - Same categories, elementary level
    ('Practical Life', 'Community Building', 'Lower Elementary', 1, 'Organize class meetings'),
    ('Practical Life', 'Time Management', 'Lower Elementary', 2, 'Plan daily work schedule'),
    ('Practical Life', 'Research Skills', 'Lower Elementary', 3, 'Use reference materials'),
    ('Sensorial', 'Geometric Solids', 'Lower Elementary', 1, 'Identify 3D shapes'),
    ('Sensorial', 'Sensorial Extensions', 'Lower Elementary', 2, 'Advanced sensorial discrimination'),
    ('Mathematics', 'Multiplication Board', 'Lower Elementary', 1, 'Memorize multiplication facts'),
    ('Mathematics', 'Division Board', 'Lower Elementary', 2, 'Understand division concept'),
    ('Mathematics', 'Fraction Circles', 'Lower Elementary', 3, 'Introduction to fractions'),
    ('Mathematics', 'Decimal Board', 'Lower Elementary', 4, 'Work with decimal numbers'),
    ('Culture', 'Timeline of Life', 'Lower Elementary', 1, 'Study evolution of life'),
    ('Culture', 'Parts of Plants', 'Lower Elementary', 2, 'Detailed plant anatomy'),
    ('Culture', 'Solar System', 'Lower Elementary', 3, 'Learn planets and their properties'),
    ('Culture', 'Ancient Civilizations', 'Lower Elementary', 4, 'Study early human societies'),
    ('Language', 'Word Study', 'Lower Elementary', 1, 'Analyze word structure'),
    ('Language', 'Grammar Boxes', 'Lower Elementary', 2, 'Study parts of speech'),
    ('Language', 'Sentence Analysis', 'Lower Elementary', 3, 'Diagram sentences'),
    ('Language', 'Reading Comprehension', 'Lower Elementary', 4, 'Analyze texts for meaning'),
    
    -- Upper Elementary (9-12 years) - Same categories, advanced content
    ('Practical Life', 'Project Management', 'Upper Elementary', 1, 'Plan and execute long-term projects'),
    ('Practical Life', 'Leadership Skills', 'Upper Elementary', 2, 'Lead group activities'),
    ('Practical Life', 'Business Basics', 'Upper Elementary', 3, 'Understand micro-economy'),
    ('Sensorial', 'Advanced Measurement', 'Upper Elementary', 1, 'Precise measurement and estimation'),
    ('Sensorial', 'Scientific Observation', 'Upper Elementary', 2, 'Detailed observation and recording'),
    ('Mathematics', 'Algebraic Thinking', 'Upper Elementary', 1, 'Introduction to variables'),
    ('Mathematics', 'Geometric Theorems', 'Upper Elementary', 2, 'Understand basic proofs'),
    ('Mathematics', 'Ratio and Proportion', 'Upper Elementary', 3, 'Solve ratio problems'),
    ('Mathematics', 'Statistical Analysis', 'Upper Elementary', 4, 'Collect and interpret data'),
    ('Culture', 'World Geography', 'Upper Elementary', 1, 'Study political and physical geography'),
    ('Culture', 'Chemistry Basics', 'Upper Elementary', 2, 'Understand atomic structure'),
    ('Culture', 'Human Body Systems', 'Upper Elementary', 3, 'Study anatomy and physiology'),
    ('Culture', 'World History', 'Upper Elementary', 4, 'Explore major historical events'),
    ('Language', 'Literary Analysis', 'Upper Elementary', 1, 'Analyze themes and symbolism'),
    ('Language', 'Research Papers', 'Upper Elementary', 2, 'Write documented research'),
    ('Language', 'Public Speaking', 'Upper Elementary', 3, 'Prepare and deliver presentations'),
    ('Language', 'Creative Writing', 'Upper Elementary', 4, 'Develop original narratives'),
    
    -- Middle School (12-15 years) - Same categories, adolescent level
    ('Practical Life', 'Entrepreneurship', 'Middle School', 1, 'Develop business plan'),
    ('Practical Life', 'Community Service', 'Middle School', 2, 'Organize service projects'),
    ('Practical Life', 'Career Exploration', 'Middle School', 3, 'Research career paths'),
    ('Sensorial', 'Design Thinking', 'Middle School', 1, 'Apply design process to problems'),
    ('Sensorial', 'Aesthetic Appreciation', 'Middle School', 2, 'Analyze art and design'),
    ('Mathematics', 'Algebra I', 'Middle School', 1, 'Solve linear equations'),
    ('Mathematics', 'Geometry', 'Middle School', 2, 'Geometric proofs and theorems'),
    ('Mathematics', 'Pre-Calculus Concepts', 'Middle School', 3, 'Introduction to functions'),
    ('Mathematics', 'Applied Mathematics', 'Middle School', 4, 'Use math in real-world contexts'),
    ('Culture', 'Global Issues', 'Middle School', 1, 'Study contemporary world challenges'),
    ('Culture', 'Environmental Science', 'Middle School', 2, 'Understand ecosystems and conservation'),
    ('Culture', 'Physics Principles', 'Middle School', 3, 'Study motion, energy, and forces'),
    ('Culture', 'Cultural Anthropology', 'Middle School', 4, 'Compare human cultures'),
    ('Language', 'Advanced Composition', 'Middle School', 1, 'Write argumentative essays'),
    ('Language', 'World Literature', 'Middle School', 2, 'Study global literary traditions'),
    ('Language', 'Debate and Rhetoric', 'Middle School', 3, 'Construct logical arguments'),
    ('Language', 'Media Literacy', 'Middle School', 4, 'Analyze media messages critically')
ON CONFLICT (category, age_group, display_order) DO NOTHING;

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
),
all_categories AS (
    SELECT DISTINCT category FROM category_presentations
),
child_categories AS (
    SELECT ccm.child_id, ccm.class_id, ac.category, au.id as admin_id
    FROM child_class_mapping ccm
    CROSS JOIN all_categories ac
    CROSS JOIN admin_user au
)
INSERT INTO schedules (child_id, class_id, name, category, display_order, status, notes, created_by)
SELECT 
    cc.child_id,
    cc.class_id,
    cp.name,
    cp.category,
    cp.display_order,
    CASE WHEN cp.display_order = 1 THEN 'to be presented' ELSE 'prerequisites not met' END as status,
    cp.notes,
    cc.admin_id
FROM child_categories cc
JOIN category_presentations cp ON cc.category = cp.category;

WITH admin_user AS (
    SELECT id FROM users WHERE role = 'admin' LIMIT 1
),
child_class_mapping AS (
    SELECT 
        ch.id as child_id,
        cc.class_id
    FROM children ch
    JOIN class_children cc ON ch.id = cc.child_id
),
attendance_data AS (
    VALUES
        (0, TIME '08:55', TIME '15:05', 'On time'),
        (0, TIME '09:20', TIME '15:10', 'Late arrival - traffic'),
        (-1, TIME '08:45', TIME '14:50', 'On time'),
        (-1, TIME '09:30', TIME '15:00', 'Late arrival - appointment')
)
INSERT INTO class_attendance (
    class_id,
    child_id,
    attendance_date,
    check_in_at,
    check_out_at,
    checked_in_by,
    checked_out_by,
    notes
)
SELECT
    ccm.class_id,
    ccm.child_id,
    CURRENT_DATE + ad.column1,
    (CURRENT_DATE + ad.column1) + ad.column2,
    (CURRENT_DATE + ad.column1) + ad.column3,
    au.id,
    au.id,
    ad.column4
FROM child_class_mapping ccm
CROSS JOIN admin_user au
CROSS JOIN attendance_data ad
ON CONFLICT (class_id, child_id, attendance_date) DO NOTHING;
