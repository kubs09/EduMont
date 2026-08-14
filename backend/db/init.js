import console from 'console';
import path from 'path';
import { fileURLToPath } from 'url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, closePool, pool } from './client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(__dirname, '../drizzle');

const schemaAlreadyExists = async () => {
  const result = await pool.query(
    "select to_regclass('public.users') is not null as schema_exists"
  );

  return !!result.rows[0]?.schema_exists;
};

const initDatabase = async () => {
  try {
    if (await schemaAlreadyExists()) {
      console.log('✅ Database schema already exists; skipping initialization');
      return;
    }

    await migrate(db, { migrationsFolder });
    console.log('✅ Database migrations applied successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw new Error(`Database initialization failed: ${err.message}`);
  }
};

export const closeDatabasePool = () => closePool();

export default initDatabase;
