/* eslint-disable */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
});

async function createScheduleTable() {
  try {
    console.log('Creating schedules table...');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
        class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        activity VARCHAR(200),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER REFERENCES users(id),
        UNIQUE(child_id, date, start_time)
      );
    `;

    await pool.query(createTableQuery);

    console.log('Creating indexes...');

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_schedules_child_id ON schedules(child_id);
      CREATE INDEX IF NOT EXISTS idx_schedules_class_id ON schedules(class_id);
      CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
    `;

    await pool.query(createIndexes);

    console.log('Schedule table and indexes created successfully!');
  } catch (error) {
    console.error('Error creating schedule table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createScheduleTable();
