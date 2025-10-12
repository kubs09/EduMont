/* eslint-disable */
const path = require('path');

// Set up environment for the backend server
process.env.VERCEL = 'true';
process.env.USE_BCRYPTJS = 'true';

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

  // Import and export the Express app
  app = require(path.join(backendPath, 'server.js'));
} catch (error) {
  console.error('Failed to load server:', error);
  console.error('Stack:', error.stack);

  // Create a minimal error app
  const express = require('express');
  app = express();
  app.use((req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      backendPath: backendPath,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  });
}

module.exports = app;
