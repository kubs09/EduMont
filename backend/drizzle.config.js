import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import process from 'process';

// Reads LOCAL Postgres credentials only (see POSTGRES_* below) and is used
// by `drizzle-kit generate` to diff db/schema.js against migration history
// and produce new SQL files in db/drizzle/. It does NOT apply migrations to
// Supabase — that's db/migrate.js, run manually via `npm run migrate` or
// automatically in CI on push to main (.github/workflows/ci.yml).
export default defineConfig({
  schema: './db/schema.js',
  out: './db/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT || 5432),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
});
