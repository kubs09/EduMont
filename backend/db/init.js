/* eslint-disable */
const pool = require('../config/database');

const initDatabase = async () => {
  const createClassesTable = `
    CREATE TABLE IF NOT EXISTS classes (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT
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

  try {
    await pool.query(createClassesTable);
    await pool.query(createClassTeachersTable);
    await pool.query(createClassChildrenTable);
    await pool.query(createMessagesTable);
    await pool.query('SELECT * FROM users');
    await pool.query('SELECT * FROM children');
    await pool.query('SELECT * FROM classes');
    await pool.query('SELECT * FROM class_teachers');
    await pool.query('SELECT * FROM class_children');
    await pool.query('SELECT * FROM messages');
    console.log('Database tables verified successfully');
  } catch (err) {
    console.error('Database verification error:', err);
    throw new Error(
      'Required database tables do not exist. Please ensure the database is properly initialized.'
    );
  }
};

module.exports = initDatabase;
