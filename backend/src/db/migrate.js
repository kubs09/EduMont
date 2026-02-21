/* eslint-disable */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
});

async function migrate() {
  try {
    const schemaFile = path.join(__dirname, 'schema.sql');
    const insertDataFile = path.join(__dirname, 'insert.sql');
    const schema = fs.readFileSync(schemaFile, 'utf8');
    const insertData = fs.readFileSync(insertDataFile, 'utf8');

    await pool.query(schema);
    await pool.query(insertData);
  } catch (error) {
    throw error;
  } finally {
    await pool.end();
  }
}

migrate();
