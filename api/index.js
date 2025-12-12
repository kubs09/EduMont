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
module.exports = (req, res) => {
  // Vercel rewrites /api/xxx to /api/index.js?path=xxx
  // We need to reconstruct the original path for Express to route correctly
  
  // Debug logging
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
    // Vercel sends the path segment as a query parameter
    if (queryPath) {
      // Get the path from query parameter (set by Vercel rewrite)
      let pathSegment = Array.isArray(queryPath) 
        ? queryPath.join('/') 
        : String(queryPath);
      
      // Ensure it starts with /
      if (!pathSegment.startsWith('/')) {
        pathSegment = '/' + pathSegment;
      }
      
      // Reconstruct the full API path
      const newUrl = `/api${pathSegment}`;
      
      // Modify the request object for Express routing
      req.url = newUrl;
      if (req.originalUrl) {
        req.originalUrl = newUrl;
      }
      
      console.log('✅ [API Handler] Reconstructed URL:', newUrl);
    } else {
      // If no query parameter, check if URL is already correct
      if (incomingUrl && !incomingUrl.startsWith('/api')) {
        // Make sure it has /api prefix for the app routing
        req.url = '/api' + (incomingUrl.startsWith('/') ? incomingUrl : '/' + incomingUrl);
        console.log('⚠️  [API Handler] Added /api prefix:', req.url);
      }
    }

    console.log('🚀 [API Handler] Passing to Express app with URL:', req.url);
    
    // Pass to Express app for routing
    const result = app(req, res);
    
    // Handle promise if the app returns a promise (async)
    if (result && typeof result.then === 'function') {
      return result.catch(error => {
        console.error('❌ [API Handler] Promise error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Server error',
            message: error.message,
          });
        }
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ [API Handler] Exception caught:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'API handler error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
};
