/* eslint-disable */
require('dotenv').config();
const { Pool } = require('pg');

// Determine if using Supabase in production/preview
const useSupabase =
  process.env.USE_SUPABASE === 'true' &&
  (process.env.VERCEL || process.env.NODE_ENV === 'production');

// Handle different SSL configurations for different environments
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

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials missing: SUPABASE_URL and SUPABASE_KEY required');
  }

  // Extract connection details from Supabase URL (postgresql://user:password@host:port/database)
  // Or use a direct connection string if provided
  poolConfig = process.env.SUPABASE_DATABASE_URL
    ? {
        connectionString: process.env.SUPABASE_DATABASE_URL,
        ssl: getSSLConfig(),
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        max: 20,
      }
    : {
        user: process.env.SUPABASE_USER || 'postgres',
        host: new URL(supabaseUrl).hostname,
        database: process.env.SUPABASE_DB || 'postgres',
        password: supabaseKey,
        port: 5432,
        ssl: getSSLConfig(),
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        max: 20,
      };

  console.log('📡 Using Supabase PostgreSQL connection');
} else {
  // Use local PostgreSQL connection
  poolConfig = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
    ssl: getSSLConfig(),
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 20,
  };

  console.log('🗄️ Using local PostgreSQL connection');
}

const pool = new Pool(poolConfig);

module.exports = pool;
