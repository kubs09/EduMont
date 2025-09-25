/* eslint-disable */
require('module-alias/register');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://10.0.1.37:3000',
      process.env.FRONTEND_URL,
      /\.vercel\.app$/,
    ],
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: '1mb' }));

// Add a simple test endpoint that doesn't require modules
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
  });
});

// Import modules with better error handling
let pool,
  initDatabase,
  authRoutes,
  childrenRoutes,
  usersRoutes,
  classesRoutes,
  schedulesRoutes,
  passwordResetRoutes,
  messageRoutes;

let modulesLoaded = false;
let moduleError = null;

try {
  pool = require('@config/database');
  initDatabase = require('@db/init');
  authRoutes = require('@routes/auth');
  childrenRoutes = require('@routes/children');
  usersRoutes = require('@routes/users');
  classesRoutes = require('@routes/classes');
  schedulesRoutes = require('@routes/schedules');
  passwordResetRoutes = require('@routes/password-reset');
  messageRoutes = require('@routes/messages');
  modulesLoaded = true;
} catch (error) {
  console.error('Module import error:', error);
  moduleError = error.message;
}

// Add debug route that doesn't require database
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'Debug info',
    modulesLoaded,
    moduleError,
    timestamp: new Date().toISOString(),
  });
});

// Initialize database only if modules loaded successfully
let dbInitialized = false;
const initDB = async () => {
  if (!modulesLoaded) {
    throw new Error('Modules not loaded');
  }
  if (!dbInitialized && pool && initDatabase) {
    try {
      await pool.connect();
      await initDatabase();
      dbInitialized = true;
    } catch (err) {
      console.error('Database initialization failed:', err);
      throw err;
    }
  }
};

// Database middleware with better error handling - but skip for test/debug routes
app.use(async (req, res, next) => {
  // Skip database init for test and debug routes
  if (req.path === '/api/test' || req.path === '/api/debug') {
    return next();
  }

  if (!modulesLoaded) {
    return res.status(500).json({
      error: 'Server modules not loaded',
      details: moduleError,
    });
  }

  try {
    await initDB();
    next();
  } catch (err) {
    console.error('DB init error:', err);
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

// Routes - only mount if modules loaded successfully
if (modulesLoaded) {
  if (passwordResetRoutes) app.use('/api', passwordResetRoutes);
  if (authRoutes) app.use('/api', authRoutes);
  if (childrenRoutes) app.use('/api/children', childrenRoutes);
  if (usersRoutes) app.use('/api/users', usersRoutes);
  if (classesRoutes) app.use('/api/classes', classesRoutes);
  if (messageRoutes) app.use('/api/messages', messageRoutes);
  if (schedulesRoutes) app.use('/api/schedules', schedulesRoutes);
}

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

module.exports = app;
