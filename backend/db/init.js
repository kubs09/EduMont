/* eslint-disable */
const pool = require('../config/database');

const initDatabase = async () => {
  const createClassesTable = `
    CREATE TABLE IF NOT EXISTS classes (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      min_age INTEGER,
      max_age INTEGER
    );
  `;

  const createClassTeachersTable = `
    CREATE TABLE IF NOT EXISTS class_teachers (
      class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'assistant')),
      PRIMARY KEY (class_id, teacher_id),
      UNIQUE (class_id, role)
    );
  `;

  const createClassChildrenTable = `
    CREATE TABLE IF NOT EXISTS class_children (
      class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (class_id, child_id)
    );
  `;

  const createMessagesTable = `
    CREATE TABLE IF NOT EXISTS messages (
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
  `;

  const createChildrenTable = `
    CREATE TABLE IF NOT EXISTS children (
      id SERIAL PRIMARY KEY,
      firstname VARCHAR(100) NOT NULL,
      surname VARCHAR(100) NOT NULL,
      date_of_birth DATE NOT NULL,
      notes TEXT
    );
  `;

  const createChildParentsTable = `
    CREATE TABLE IF NOT EXISTS child_parents (
      child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (child_id, parent_id)
    );
  `;

  const createDocumentsTable = `
    CREATE TABLE IF NOT EXISTS documents (
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
  `;

  const createClassAttendanceTable = `
    CREATE TABLE IF NOT EXISTS class_attendance (
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
  `;

  try {
    await pool.query(createClassesTable);
    await pool.query(createClassTeachersTable);
    await pool.query(createClassChildrenTable);
    await pool.query(createMessagesTable);
    await pool.query(createChildrenTable);
    await pool.query(createChildParentsTable);
    await pool.query(createDocumentsTable);
    await pool.query(createClassAttendanceTable);
    await pool.query('SELECT * FROM users');
    await pool.query('SELECT * FROM children');
    await pool.query('SELECT * FROM child_parents');
    await pool.query('SELECT * FROM classes');
    await pool.query('SELECT * FROM class_teachers');
    await pool.query('SELECT * FROM class_children');
    await pool.query('SELECT * FROM messages');
    await pool.query('SELECT * FROM documents');
    await pool.query('SELECT * FROM class_attendance');
  } catch (err) {
    console.error('Database verification error:', err);
    throw new Error(
      'Required database tables do not exist. Please ensure the database is properly initialized.'
    );
  }
};

module.exports = initDatabase;
