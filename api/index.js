import { join, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { URL, fileURLToPath, pathToFileURL } from 'url';
import process from 'process';
import console from 'console';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set up environment for the backend server
process.env.VERCEL = 'true';
process.env.USE_BCRYPTJS = 'true';

// Use Supabase in production, SQLite in development
if (process.env.USE_SUPABASE !== 'true') {
  process.env.DB_PATH = process.env.DB_PATH || '/tmp/edumont.db';

  // Ensure /tmp directory exists and is writable
  try {
    if (!existsSync('/tmp')) {
      mkdirSync('/tmp', { recursive: true });
    }
    console.log('✅ /tmp directory ready');
  } catch (error) {
    console.error('❌ Failed to create /tmp directory:', error);
  }
} else {
  console.log('Using Supabase - skipping SQLite setup');
}

// Log database configuration
console.log('Database configuration:', {
  useSupabase: process.env.USE_SUPABASE === 'true',
  supabaseUrl: process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set',
  supabaseKey: process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set',
  dbPath: process.env.DB_PATH,
  nodeEnv: process.env.NODE_ENV,
  vercel: process.env.VERCEL,
});

// Get the correct backend path
const backendPath = join(__dirname, '..', 'backend');

let app;
try {
  const serverModule = await import(pathToFileURL(join(backendPath, 'server.js')).href);
  app = serverModule.default ?? serverModule;
} catch (error) {
  app = (req, res) => {
    const isDev = process.env.NODE_ENV === 'development';
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      details: isDev
        ? {
            backendPath,
            dbPath: process.env.DB_PATH,
            cwd: process.cwd(),
            stack: error.stack,
          }
        : undefined,
    });
  };
}

// Reconstructs the Express-relative path (e.g. "/api/children/5") from a
// Vercel serverless request. Vercel invokes this function for every /api/*
// route and passes the original path either via the `path` query param
// (see vercel.json's rewrite rule) or embedded in the raw incoming URL,
// depending on how the request arrived.
const resolveApiPath = (req) => {
  const incomingUrl = req.url || req.originalUrl || '/api/index.js';
  let parsedQueryPath = req.query?.path;

  if (!parsedQueryPath && typeof incomingUrl === 'string') {
    try {
      const urlObj = new URL(incomingUrl, 'http://localhost');
      const pathParam = urlObj.searchParams.get('path');
      if (pathParam) {
        parsedQueryPath = pathParam;
      }
    } catch (e) {
      console.warn('⚠️ [API Handler] Failed to parse query path from URL:', e?.message);
    }
  }

  if (parsedQueryPath) {
    const pathSegments = Array.isArray(parsedQueryPath) ? parsedQueryPath : [parsedQueryPath];
    let reconstructedPath = '/api';
    for (const segment of pathSegments) {
      if (segment) {
        reconstructedPath += '/' + String(segment).split('/').filter(Boolean).join('/');
      }
    }
    return reconstructedPath;
  }

  if (incomingUrl && incomingUrl !== '/api/index.js') {
    const urlPath = incomingUrl.split('?')[0];
    if (urlPath !== '/' && !urlPath.startsWith('/api/index.js')) {
      return urlPath.startsWith('/api') ? urlPath : '/api' + urlPath;
    }
  }

  return '/api';
};

export default async (req, res) => {
  const incomingUrl = req.url || req.originalUrl || '/api/index.js';
  const queryPath = req.query?.path;

  console.log('🔍 [API Handler] Incoming request:', {
    method: req.method,
    incomingUrl,
    originalUrl: req.originalUrl,
    path: req.path,
    queryPath,
    allQuery: JSON.stringify(req.query),
  });

  try {
    const reconstructedPath = resolveApiPath(req);

    req.url = reconstructedPath;
    req.originalUrl = reconstructedPath;

    app(req, res);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        error: 'API handler error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
};
