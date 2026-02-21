DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent');

DROP TABLE IF EXISTS class_history, class_attendance, child_excuses, users, invitations, messages, child_parents, children, classes, class_teachers, class_children, presentations, documents, category_presentations CASCADE;
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
    PRIMARY KEY (class_id, child_id),
    UNIQUE (child_id)
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

CREATE TABLE presentations (
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

CREATE INDEX idx_presentations_child_id ON presentations(child_id);
CREATE INDEX idx_presentations_class_id ON presentations(class_id);
CREATE INDEX idx_presentations_status ON presentations(status);
CREATE INDEX idx_presentations_category_status ON presentations(category, status);
CREATE INDEX idx_presentations_child_category ON presentations(child_id, category);

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

CREATE INDEX idx_premissions_class_id ON class_teachers(class_id);
CREATE INDEX idx_premissions_teacher_id ON class_teachers(teacher_id);


