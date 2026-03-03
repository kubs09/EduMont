import 'dotenv/config';
import process from 'process';
import console from 'console';
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
let configError = null;

try {
  if (useSupabase) {
    const supabaseConnectionString =
      process.env.SUPABASE_DATABASE_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.SUPABASE_URL;

    if (!supabaseConnectionString) {
      configError =
        'Supabase enabled but missing database connection string. Set SUPABASE_DATABASE_URL, DATABASE_URL, or POSTGRES_URL';
      console.error('❌ ' + configError);
      throw new Error(configError);
    }

    if (/^https?:\/\//i.test(supabaseConnectionString)) {
      configError =
        'Supabase database connection string is invalid. Use the Postgres URI (postgres://...), not the project HTTP URL';
      console.error('❌ ' + configError);
      throw new Error(configError);
    }

    poolConfig = {
      connectionString: supabaseConnectionString,
      ssl: getSSLConfig({ defaultEnabled: true }),
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      max: 1,
      min: 0,
      statement_timeout: 30000,
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
      connectionTimeoutMillis: process.env.NODE_ENV === 'production' ? 30000 : 5000,
      idleTimeoutMillis: process.env.NODE_ENV === 'production' ? 30000 : 30000,
      max: process.env.NODE_ENV === 'production' ? 5 : 20,
    };
  }
} catch (error) {
  console.error('❌ Database configuration error:', error.message);
  configError = error;
  // Create a dummy poolConfig to prevent total failure
  poolConfig = {
    host: 'invalid',
    database: 'invalid',
    user: 'invalid',
    password: 'invalid',
    port: 5432,
  };
}

const createUnavailablePool = (cause) => ({
  query: async () => {
    throw cause instanceof Error ? cause : new Error(String(cause));
  },
  connect: async () => {
    throw cause instanceof Error ? cause : new Error(String(cause));
  },
});

let pool;
if (configError) {
  pool = createUnavailablePool(configError);
} else {
  try {
    pool = new Pool(poolConfig);
  } catch (error) {
    console.error('❌ Failed to create database pool:', error.message);
    pool = createUnavailablePool(error);
  }
}

// Log pool configuration (without sensitive credentials)
if (!configError) {
  console.log('📊 Database Configuration:', {
    useSupabase,
    host: poolConfig.host || 'N/A',
    database: poolConfig.database || poolConfig.connectionString?.split('/').pop() || 'N/A',
    user: poolConfig.user || 'N/A',
    sslEnabled: !!poolConfig.ssl,
  });
} else {
  console.log('⚠️  Database Configuration Error:', configError);
}

export const query = (text, params) => pool.query(text, params);
export const connect = () => pool.connect();

export default pool;
