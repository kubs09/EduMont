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
      PRIMARY KEY (class_id, teacher_id)
    );
  `;

  const createClassChildrenTable = `
    CREATE TABLE IF NOT EXISTS class_children (
      class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
      confirmed BOOLEAN DEFAULT FALSE,
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
      parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      notes TEXT
    );
  `;

  const createAdmissionStepsTable = `
    CREATE TABLE IF NOT EXISTS admission_steps (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      required_documents TEXT[],
      order_index INTEGER NOT NULL
    );
  `;

  const createAdmissionProgressTable = `
    CREATE TABLE IF NOT EXISTS admission_progress (
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
  `;

  const addAdmissionStatusToUsers = `
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS admission_status VARCHAR(20) 
    DEFAULT 'pending' 
    CHECK (admission_status IN ('pending', 'in_progress', 'completed', 'rejected'));
  `;

  const createAdmissionRequestsTable = `
    CREATE TABLE IF NOT EXISTS admission_requests (
      id SERIAL PRIMARY KEY,
      firstname VARCHAR(100) NOT NULL,
      surname VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      child_firstname VARCHAR(100) NOT NULL,
      child_surname VARCHAR(100) NOT NULL,
      date_of_birth DATE NOT NULL,
      message TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      denial_reason TEXT,
      CONSTRAINT status_check CHECK (status IN ('pending', 'approved', 'denied'))
    );
  `;

  try {
    await pool.query(createClassesTable);
    await pool.query(createClassTeachersTable);
    await pool.query(createClassChildrenTable);
    await pool.query(createMessagesTable);
    await pool.query(createChildrenTable);
    await pool.query(createAdmissionStepsTable);
    await pool.query(createAdmissionProgressTable);
    await pool.query(addAdmissionStatusToUsers);
    await pool.query(createAdmissionRequestsTable);
    await pool.query('SELECT * FROM users');
    await pool.query('SELECT * FROM children');
    await pool.query('SELECT * FROM classes');
    await pool.query('SELECT * FROM class_teachers');
    await pool.query('SELECT * FROM class_children');
    await pool.query('SELECT * FROM messages');
    await pool.query('SELECT * FROM admission_steps');
    await pool.query('SELECT * FROM admission_progress');

    const stepsCount = await pool.query('SELECT COUNT(*) FROM admission_steps');
    if (stepsCount.rows[0].count === '0') {
      await pool.query(`
        INSERT INTO admission_steps (name, description, required_documents, order_index) 
        VALUES 
          ('Personal Information', 'Complete your personal information and contact details', ARRAY['identification', 'proof_of_address'], 1),
          ('Child Details', 'Provide information about your child including medical history', ARRAY['birth_certificate', 'medical_records'], 2),
          ('Financial Agreement', 'Review and accept financial terms and conditions', ARRAY['signed_agreement'], 3),
          ('Final Review', 'Admin review of all submitted documents', NULL, 4)
        ON CONFLICT DO NOTHING
      `);
    }
  } catch (err) {
    console.error('Database verification error:', err);
    throw new Error(
      'Required database tables do not exist. Please ensure the database is properly initialized.'
    );
  }
};

module.exports = initDatabase;
