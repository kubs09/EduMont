import 'dotenv/config';
import process from 'process';
import path from 'path';
import { fileURLToPath } from 'url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(__dirname, '../../db/drizzle');

const { Pool } = pg;
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'montessori_test',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: process.env.POSTGRES_PORT || 5432,
});

const db = drizzle(pool);

try {
  await migrate(db, { migrationsFolder });
  console.log(`Migrations applied to ${process.env.POSTGRES_DB || 'montessori_test'}`);
} finally {
  await pool.end();
}
