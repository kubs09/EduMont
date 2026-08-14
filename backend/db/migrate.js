import 'dotenv/config';
import console from 'console';
import process from 'process';
import path from 'path';
import { fileURLToPath } from 'url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, closePool } from './client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(__dirname, 'drizzle');

async function runMigration() {
  try {
    // migrate() tracks applied migrations itself (in a drizzle.__drizzle_migrations
    // table) and only runs the ones it hasn't seen yet, so it's safe to call on a
    // database that already has the schema from a prior run. This is what makes it
    // safe to invoke on every push to main in CI (see .github/workflows/ci.yml,
    // migrate-production job) as well as manually via `npm run migrate`.
    await migrate(db, { migrationsFolder });
  } finally {
    await closePool();
  }
}

runMigration().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
