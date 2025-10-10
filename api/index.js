// Vercel serverless function entry point
const path = require('path');

// Set up environment for the backend server
process.env.VERCEL = 'true';

// Set up module alias resolution for the backend
const moduleAlias = require('module-alias');

// Add aliases for backend modules
moduleAlias.addAliases({
  '@config': path.join(__dirname, '..', 'backend', 'config'),
  '@db': path.join(__dirname, '..', 'backend', 'db'),
  '@routes': path.join(__dirname, '..', 'backend', 'routes'),
  '@middleware': path.join(__dirname, '..', 'backend', 'middleware'),
  '@utils': path.join(__dirname, '..', 'backend', 'utils')
});

// Add the backend directory to the require path
const backendPath = path.join(__dirname, '..', 'backend');
require('module').globalPaths.push(backendPath);
require('module').globalPaths.push(path.join(backendPath, 'node_modules'));

// Import and export the Express app
const app = require('../backend/server.js');

module.exports = app;
