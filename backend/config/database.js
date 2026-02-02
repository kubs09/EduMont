/* eslint-disable */
require('dotenv').config();
const { Pool } = require('pg');

const useSupabase =
  (process.env.NODE_ENV === 'production' ||
    !!process.env.VERCEL ||
    process.env.USE_SUPABASE === 'true') &&
  (!!process.env.SUPABASE_URL || !!process.env.SUPABASE_DATABASE_URL);

const getSSLConfig = () => {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return {
      rejectUnauthorized: false,
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
        ssl: { rejectUnauthorized: false },
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
        ssl: { rejectUnauthorized: false },
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
    ssl: getSSLConfig(),
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: process.env.NODE_ENV === 'production' ? 10000 : 30000,
    max: process.env.NODE_ENV === 'production' ? 5 : 20,
  };
}

const pool = new Pool(poolConfig);

module.exports = pool;
