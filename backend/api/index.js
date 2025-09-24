/* eslint-disable */
require('module-alias/register');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import your modules with error handling
let pool,
  initDatabase,
  authRoutes,
  childrenRoutes,
  usersRoutes,
  classesRoutes,
  schedulesRoutes,
  passwordResetRoutes,
  messageRoutes;

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
} catch (error) {
  console.error('Module import error:', error);
}

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

// Initialize database connection once
let dbInitialized = false;
const initDB = async () => {
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

app.use(async (req, res, next) => {
  try {
    await initDB();
    next();
  } catch (err) {
    console.error('DB init error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.use((req, res, next) => {
  next();
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next(err);
});

// Routes with error handling
if (passwordResetRoutes) app.use('/api', passwordResetRoutes);
if (authRoutes) app.use('/api', authRoutes);
if (childrenRoutes) app.use('/api/children', childrenRoutes);
if (usersRoutes) app.use('/api/users', usersRoutes);
if (classesRoutes) app.use('/api/classes', classesRoutes);
if (messageRoutes) app.use('/api/messages', messageRoutes);
if (schedulesRoutes) app.use('/api/schedules', schedulesRoutes);

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

// Export the Express app as a serverless function
module.exports = app;
