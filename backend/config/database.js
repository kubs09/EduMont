/* eslint-disable */
require('dotenv').config();
const { Pool } = require('pg');

// Handle different SSL configurations for different environments
const getSSLConfig = () => {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return {
      rejectUnauthorized: false
    };
  }
  return false;
};

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  ssl: getSSLConfig(),
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20
});

module.exports = pool;
