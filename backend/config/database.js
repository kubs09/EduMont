/* eslint-disable */
require('dotenv').config();
const { Pool } = require('pg');

// Determine if using Supabase in production/preview
// Only use Supabase if explicitly enabled AND credentials are provided
const useSupabase =
  (process.env.NODE_ENV === 'production' ||
    !!process.env.VERCEL ||
    process.env.USE_SUPABASE === 'true') &&
  (!!process.env.SUPABASE_URL || !!process.env.SUPABASE_DATABASE_URL);

console.log('Database configuration check:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  USE_SUPABASE: process.env.USE_SUPABASE,
  SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set',
  SUPABASE_DATABASE_URL: process.env.SUPABASE_DATABASE_URL ? '✅ Set' : '❌ Not set',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set',
  useSupabase,
});

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
  // Use Supabase PostgreSQL connection
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl && !process.env.SUPABASE_DATABASE_URL) {
    // If SUPABASE_DATABASE_URL is set, we can use that instead
    console.warn(
      '⚠️ Supabase URL not configured, but SUPABASE_DATABASE_URL provided - will use that'
    );
  }

  if (!supabaseKey && !process.env.SUPABASE_DATABASE_URL) {
    throw new Error(
      'Supabase credentials incomplete: Either SUPABASE_URL + SUPABASE_ANON_KEY or SUPABASE_DATABASE_URL required'
    );
  }

  // Extract connection details from Supabase URL (postgresql://user:password@host:port/database)
  // Or use a direct connection string if provided
  poolConfig = process.env.SUPABASE_DATABASE_URL
    ? {
        connectionString: process.env.SUPABASE_DATABASE_URL,
        ssl: getSSLConfig(),
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 10000,
        max: 5,
      }
    : {
        user: process.env.SUPABASE_USER || 'postgres',
        host: new URL(supabaseUrl).hostname,
        database: process.env.SUPABASE_DB || 'postgres',
        password: supabaseKey,
        port: 5432,
        ssl: getSSLConfig(),
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 10000,
        max: 5,
      };

  console.log('📡 Using Supabase PostgreSQL connection');
} else {
  // Use local PostgreSQL connection as fallback
  if (!process.env.POSTGRES_HOST) {
    console.warn('⚠️ No POSTGRES_HOST configured - using localhost as default');
  }

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
