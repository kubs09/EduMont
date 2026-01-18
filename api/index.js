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
  supabaseKey: process.env.SUPABASE_KEY ? '✅ Set' : '❌ Not set',
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
  console.log('Loading server from:', path.join(backendPath, 'server.js'));
  console.log('Backend path:', backendPath);
  console.log('Database path:', process.env.DB_PATH);
  console.log('Working directory:', process.cwd());

  // Import and export the Express app
  app = require(path.join(backendPath, 'server.js'));

  console.log('✅ Server loaded successfully');
} catch (error) {
  console.error('❌ Failed to load server:', error);
  console.error('Stack:', error.stack);

  // Create a minimal error app
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

// Vercel serverless handler - converts rewritten paths back to original API paths
module.exports = async (req, res) => {
  // Vercel rewrites /api/xxx to /api/index.js?path=xxx
  // We need to reconstruct the original path for Express to route correctly

  // Debug logging
  const incomingUrl = req.url || req.originalUrl || '/api/index.js';
  const queryPath = req.query?.path;
  // Fallback: parse query from raw URL when req.query isn't available
  let parsedQueryPath = queryPath;
  try {
    if (!parsedQueryPath && typeof incomingUrl === 'string') {
      const urlMod = require('url');
      const parsed = urlMod.parse(incomingUrl, true);
      if (parsed && parsed.query && parsed.query.path) {
        parsedQueryPath = parsed.query.path;
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
    // Reconstruct the path - Vercel sends path segments as query params
    let reconstructedPath = '/api';

    if (parsedQueryPath) {
      // Get the path from query parameter (set by Vercel rewrite)
      const pathSegments = Array.isArray(parsedQueryPath) ? parsedQueryPath : [parsedQueryPath];

      for (const segment of pathSegments) {
        if (segment) {
          reconstructedPath += '/' + String(segment).split('/').filter(Boolean).join('/');
        }
      }
    } else if (incomingUrl && incomingUrl !== '/api/index.js') {
      // If no query param but URL has path, use that
      const urlPath = incomingUrl.split('?')[0]; // Remove query string
      if (urlPath !== '/' && !urlPath.startsWith('/api/index.js')) {
        reconstructedPath = urlPath.startsWith('/api') ? urlPath : '/api' + urlPath;
      }
    }

    // Set the URL for Express routing
    req.url = reconstructedPath;
    req.originalUrl = reconstructedPath;

    console.log('✅ [API Handler] Reconstructed URL:', reconstructedPath);
    console.log('🚀 [API Handler] Passing to Express app');

    // Pass to Express app for routing
    // The app handles the request and sends response
    app(req, res);
  } catch (error) {
    console.error('❌ [API Handler] Exception caught:', error);
    console.error('Stack:', error.stack);

    if (!res.headersSent) {
      res.status(500).json({
        error: 'API handler error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
};
