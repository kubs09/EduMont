import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import process from 'process';

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
