import 'dotenv/config';
import pkg from 'pg';
import process from 'process';
import fs from 'fs';
import path from 'path';
import console from 'console';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
});

async function migrate() {
  try {
    const schemaDataFile = path.join(__dirname, 'schema.sql');
    const schemaData = fs.readFileSync(schemaDataFile, 'utf8');

    await pool.query(schemaData);
  } finally {
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
