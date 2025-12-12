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

// Vercel serverless handler: normalize path from rewrite
module.exports = (req, res) => {
  // Vercel sends the path as a query parameter from the rewrite
  if (req.query && req.query.path) {
    // Reconstruct the original requested path
    let pathValue = Array.isArray(req.query.path) 
      ? req.query.path.join('/') 
      : req.query.path;
    
    // Ensure path starts with /
    if (!pathValue.startsWith('/')) {
      pathValue = '/' + pathValue;
    }
    
    // Set the path - the Express app will handle routing from here
    req.url = `/api${pathValue}`;
    
    console.log('Path reconstruction:', {
      originalQuery: req.query.path,
      reconstructedUrl: req.url,
      timestamp: new Date().toISOString(),
    });
  }

  return app(req, res);
};
