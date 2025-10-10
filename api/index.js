const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Configure CORS for Vercel
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(bodyParser.json({ limit: '1mb' }));

// Add debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'Debug info - Vercel serverless function',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    url: req.url,
    method: req.method,
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Fallback for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

module.exports = app;
