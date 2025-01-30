/* eslint-disable */
const pool = require('../config/database');

const initDatabase = async () => {
  try {
    await pool.query('SELECT * FROM users');
    await pool.query('SELECT * FROM children');
    console.log('Database tables verified successfully');
  } catch (err) {
    console.error('Database verification error:', err);
    throw new Error(
      'Required database tables do not exist. Please ensure the database is properly initialized.'
    );
  }
};

module.exports = initDatabase;
