import 'dotenv/config';
import process from 'process';
import fs from 'fs';
import path from 'path';
import console from 'console';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const { Pool } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
});

async function seed() {
  try {
    const insertDataFile = path.join(__dirname, 'insert.sql');
    const insertData = fs.readFileSync(insertDataFile, 'utf8');

    await pool.query(insertData);
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
