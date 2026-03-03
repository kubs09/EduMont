import 'dotenv/config';
import process from 'process';
import { URL } from 'url';
import pg from 'pg';

const { Pool } = pg;

const hasSupabaseCredentials =
  !!process.env.SUPABASE_URL ||
  !!process.env.SUPABASE_DATABASE_URL ||
  !!process.env.SUPABASE_SERVICE_ROLE_KEY ||
  !!process.env.SUPABASE_ANON_KEY;

const useSupabase =
  (process.env.USE_SUPABASE === 'true' ||
    (process.env.VERCEL === 'true' && hasSupabaseCredentials)) &&
  hasSupabaseCredentials;

const parseSSLOverride = () => {
  const raw =
    process.env.DB_SSL ??
    process.env.POSTGRES_SSL ??
    process.env.PGSSLMODE ??
    process.env.SUPABASE_SSL;

  if (!raw) return null;

  const normalized = String(raw).trim().toLowerCase();

  if (['0', 'false', 'no', 'off', 'disable', 'disabled'].includes(normalized)) {
    return false;
  }

  if (['1', 'true', 'yes', 'on', 'require', 'required'].includes(normalized)) {
    return {
      rejectUnauthorized: false,
    };
  }

  if (['full', 'verify-ca', 'verify-full'].includes(normalized)) {
    return {
      rejectUnauthorized: true,
    };
  }

  return null;
};

const getSSLConfig = ({ defaultEnabled = false } = {}) => {
  const override = parseSSLOverride();

  if (override !== null) {
    return override;
  }

  if (defaultEnabled) {
    return {
      rejectUnauthorized: true,
    };
  }

  return false;
};

let poolConfig;

if (useSupabase) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseKey && !process.env.SUPABASE_DATABASE_URL) {
    throw new Error(
      'Supabase credentials incomplete: Either SUPABASE_URL + SUPABASE_ANON_KEY or SUPABASE_DATABASE_URL required'
    );
  }

  poolConfig = process.env.SUPABASE_DATABASE_URL
    ? {
        connectionString: process.env.SUPABASE_DATABASE_URL,
        ssl: getSSLConfig({ defaultEnabled: true }),
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 5000,
        max: 1,
        min: 0,
        statement_timeout: 15000,
      }
    : {
        user: process.env.SUPABASE_USER || 'postgres',
        host: new URL(supabaseUrl).hostname,
        database: process.env.SUPABASE_DB || 'postgres',
        password: supabaseKey,
        port: 5432,
        ssl: getSSLConfig({ defaultEnabled: true }),
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 5000,
        max: 1,
        min: 0,
        statement_timeout: 15000,
      };
} else {
  poolConfig = {
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'edumont',
    password: process.env.POSTGRES_PASSWORD || 'password',
    port: process.env.POSTGRES_PORT || 5432,
    ssl: getSSLConfig({
      defaultEnabled: process.env.NODE_ENV === 'production' || !!process.env.VERCEL,
    }),
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: process.env.NODE_ENV === 'production' ? 10000 : 30000,
    max: process.env.NODE_ENV === 'production' ? 5 : 20,
  };
}

const pool = new Pool(poolConfig);

export const query = (text, params) => pool.query(text, params);
export const connect = () => pool.connect();

export default pool;
