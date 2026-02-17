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
    min_age INTEGER NOT NULL,
    max_age INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (min_age >= 0 AND max_age >= min_age)
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

-- Category presentations template - defines the order of presentations for each category
CREATE TABLE category_presentations (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    display_order INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (category, display_order)
);

CREATE INDEX idx_category_presentations_category ON category_presentations(category);

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
('jana.kralova@example.com', 'Jana', 'Králová', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('martin.novotny@example.com', 'Martin', 'Novotný', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher'),
('eva.svobodova@example.com', 'Eva', 'Svobodová', '$2b$10$HRnchh4S3QItDIRHLUIrYOhbdFunDrQWP.rygwqqS3Kgt1QeHa1Pm', 'teacher')
ON CONFLICT (email) DO NOTHING;

INSERT INTO children (firstname, surname, date_of_birth, notes) VALUES
('Jakub', 'Novák', DATE '2022-01-01', 'Alergie na ořechy'),
('Ema', 'Dvořáková', DATE '2020-01-01', 'Bez speciálních požadavků'),
('Tereza', 'Svobodová', DATE '2017-01-01', 'Vegetariánská strava');

INSERT INTO child_parents (child_id, parent_id)
SELECT ch.id, u.id
FROM children ch
JOIN users u ON (
  (ch.firstname = 'Jakub' AND u.email = 'petr.novak@example.com') OR
  (ch.firstname = 'Ema' AND u.email = 'lucie.dvorakova@example.com') OR
  (ch.firstname = 'Tereza' AND u.email = 'karel.svoboda@example.com')
);

INSERT INTO classes (name, description, min_age, max_age) VALUES
('Morning Stars', 'Morning group for children aged 3-4', 3, 4),
('Afternoon Explorers', 'Afternoon group for children aged 4-5', 4, 5),
('Evening warriors', 'Evening group for children aged 6-10', 6, 10);

WITH teacher_ids AS (
  SELECT id, email FROM users WHERE role = 'teacher'
)
INSERT INTO class_teachers (class_id, teacher_id, role)
SELECT 1, id, 'teacher' FROM teacher_ids WHERE email = 'jana.kralova@example.com'
UNION ALL
SELECT 2, id, 'teacher' FROM teacher_ids WHERE email = 'eva.svobodova@example.com'
UNION ALL
SELECT 3, id, 'teacher' FROM teacher_ids WHERE email = 'martin.novotny@example.com';

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

INSERT INTO category_presentations (category, name, display_order, notes)
VALUES 
    ('Arts and Crafts', 'Complete Drawing Project', 1, 'Draw a picture of your family'),
    ('Arts and Crafts', 'Create Collage', 2, 'Create a collage with various materials'),
    ('Arts and Crafts', 'Paint with Watercolors', 3, 'Learn basic watercolor techniques'),
    ('Music', 'Learn New Song', 1, 'Learned "Twinkle Twinkle Little Star"'),
    ('Music', 'Play Simple Instrument', 2, 'Learn to play a recorder or xylophone'),
    ('Music', 'Sing in Group', 3, 'Participate in group singing'),
    ('Science', 'Nature Collection', 1, 'Collect 5 different types of leaves'),
    ('Science', 'Plant Growth Observation', 2, 'Observe and record plant growth'),
    ('Science', 'Simple Experiment', 3, 'Conduct a basic science experiment'),
    ('Mathematics', 'Practice Counting', 1, 'Count to 20'),
    ('Mathematics', 'Number Recognition', 2, 'Recognize numbers 1-20'),
    ('Mathematics', 'Basic Addition', 3, 'Learn basic addition with objects'),
    ('Construction Play', 'Build Block Tower', 1, 'Build a tower taller than yourself'),
    ('Construction Play', 'Create Block Structure', 2, 'Design and build a complex structure'),
    ('Construction Play', 'Lego Creation', 3, 'Build with LEGO following instructions'),
    ('Reading', 'Read Storybook', 1, 'Finished "The Very Hungry Caterpillar"'),
    ('Reading', 'Read Picture Book', 2, 'Read simple picture stories'),
    ('Reading', 'Read Chapter Book', 3, 'Read early chapter books'),
    ('Learning', 'Color Recognition', 1, 'Identify 8 basic colors'),
    ('Learning', 'Shape Recognition', 2, 'Identify basic shapes'),
    ('Learning', 'Letter Recognition', 3, 'Recognize alphabet letters'),
    ('PE', 'Physical Exercise', 1, 'Completed obstacle course'),
    ('PE', 'Ball Games', 2, 'Participate in ball throwing and catching'),
    ('PE', 'Team Sports', 3, 'Join in team sports activities'),
    ('Group Activity', 'Social Skills', 1, 'Share toys with friends'),
    ('Group Activity', 'Teamwork Game', 2, 'Participate in group games'),
    ('Group Activity', 'Community Activity', 3, 'Contribute to class community'),
    ('Language', 'Alphabet Practice', 1, 'Recognize letters A-M'),
    ('Language', 'Letter Writing', 2, 'Write basic letters'),
    ('Language', 'Word Building', 3, 'Build words from letters')
ON CONFLICT (category, display_order) DO NOTHING;

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
