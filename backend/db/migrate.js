import 'dotenv/config';
import console from 'console';
import process from 'process';
import path from 'path';
import { fileURLToPath } from 'url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, closePool, pool } from './client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(__dirname, '../../drizzle');

const schemaAlreadyExists = async () => {
  const result = await pool.query(
    "select to_regclass('public.users') is not null as schema_exists"
  );

  return !!result.rows[0]?.schema_exists;
};

async function runMigration() {
  try {
    if (await schemaAlreadyExists()) {
      console.log('ℹ️  Existing schema detected; skipping baseline migration');
      return;
    }

    await migrate(db, { migrationsFolder });
  } finally {
    await closePool();
  }
}

runMigration().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
