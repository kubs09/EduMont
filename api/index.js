// Vercel serverless function entry point
const path = require('path');

// Set up environment for the backend server
process.env.VERCEL = 'true';
process.env.NODE_ENV = 'production';

// Ensure the backend path is correctly resolved
const backendPath = path.resolve(__dirname, '..', 'backend');
process.chdir(backendPath);

// Add backend to module paths
require('module').globalPaths.push(backendPath);
require('module').globalPaths.push(path.join(backendPath, 'node_modules'));

try {
  // Import and export the Express app
  const app = require('../backend/server.js');
  module.exports = app;
} catch (error) {
  console.error('Failed to load backend server:', error);
  
  // Fallback minimal server
  const express = require('express');
  const app = express();
  
  app.get('/api/debug', (req, res) => {
    res.json({
      error: 'Backend failed to load',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  });
  
  app.use('/api/*', (req, res) => {
    res.status(500).json({
      error: 'Server not available',
      message: 'Backend modules failed to load',
    });
  });
  
  module.exports = app;
}
