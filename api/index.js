/* eslint-disable */
require('module-alias/register');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

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

// Add a simple test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
  });
});

// Add debug route to check what routes are available
app.get('/debug', (req, res) => {
  res.json({
    message: 'Debug info',
    availableRoutes: ['POST /login', 'GET /test', 'GET /debug'],
    authRoutesLoaded: !!authRoutes,
    timestamp: new Date().toISOString(),
  });
});

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

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next(err);
});

// Routes - remove /api prefix since Vercel routing adds it
if (authRoutes) app.use('/', authRoutes);
if (passwordResetRoutes) app.use('/', passwordResetRoutes);
if (childrenRoutes) app.use('/children', childrenRoutes);
if (usersRoutes) app.use('/users', usersRoutes);
if (classesRoutes) app.use('/classes', classesRoutes);
if (messageRoutes) app.use('/messages', messageRoutes);
if (schedulesRoutes) app.use('/schedules', schedulesRoutes);

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
