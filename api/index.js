// Vercel serverless function entry point
const path = require('path');

// Set up environment for the backend server
process.env.VERCEL = 'true';

// Add the backend directory to the require path
const backendPath = path.join(__dirname, '..', 'backend');
require('module').globalPaths.push(backendPath);
require('module').globalPaths.push(path.join(backendPath, 'node_modules'));

// Import and export the Express app
const app = require('../backend/server.js');

module.exports = app;
