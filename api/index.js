/* eslint-disable */
const path = require('path');
const fs = require('fs');

// Set up environment for the backend server
process.env.VERCEL = 'true';
process.env.USE_BCRYPTJS = 'true';

// Use Supabase in production, SQLite in development
if (process.env.USE_SUPABASE !== 'true') {
  process.env.DB_PATH = process.env.DB_PATH || '/tmp/edumont.db';

  // Ensure /tmp directory exists and is writable
  try {
    if (!fs.existsSync('/tmp')) {
      fs.mkdirSync('/tmp', { recursive: true });
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

// Set up module alias resolution for the backend
const moduleAlias = require('module-alias');

// Get the correct backend path
const backendPath = path.join(__dirname, '..', 'backend');

// Add aliases for backend modules - use absolute paths
moduleAlias.addAliases({
  '@config': path.join(backendPath, 'config'),
  '@db': path.join(backendPath, 'db'),
  '@routes': path.join(backendPath, 'routes'),
  '@middleware': path.join(backendPath, 'middleware'),
  '@utils': path.join(backendPath, 'utils'),
});

// Register the aliases
moduleAlias();

let app;
try {
  app = require(path.join(backendPath, 'server.js'));
} catch (error) {
  const express = require('express');
  app = express();
  app.use((req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      backendPath: backendPath,
      dbPath: process.env.DB_PATH,
      cwd: process.cwd(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  });
}

module.exports = async (req, res) => {
  const incomingUrl = req.url || req.originalUrl || '/api/index.js';
  const queryPath = req.query?.path;
  let parsedQueryPath = queryPath;
  try {
    if (!parsedQueryPath && typeof incomingUrl === 'string') {
      const urlObj = new URL(incomingUrl, 'http://localhost');
      const pathParam = urlObj.searchParams.get('path');
      if (pathParam) {
        parsedQueryPath = pathParam;
      }
    }
  } catch (e) {
    console.warn('⚠️ [API Handler] Failed to parse query path from URL:', e?.message);
  }

  console.log('🔍 [API Handler] Incoming request:', {
    method: req.method,
    incomingUrl,
    originalUrl: req.originalUrl,
    path: req.path,
    queryPath,
    allQuery: JSON.stringify(req.query),
  });

  try {
    let reconstructedPath = '/api';

    if (parsedQueryPath) {
      const pathSegments = Array.isArray(parsedQueryPath) ? parsedQueryPath : [parsedQueryPath];

      for (const segment of pathSegments) {
        if (segment) {
          reconstructedPath += '/' + String(segment).split('/').filter(Boolean).join('/');
        }
      }
    } else if (incomingUrl && incomingUrl !== '/api/index.js') {
      const urlPath = incomingUrl.split('?')[0];
      if (urlPath !== '/' && !urlPath.startsWith('/api/index.js')) {
        reconstructedPath = urlPath.startsWith('/api') ? urlPath : '/api' + urlPath;
      }
    }

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
