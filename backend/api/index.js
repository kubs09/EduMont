/* eslint-disable */
require('module-alias/register');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const pool = require('@config/database');
const initDatabase = require('@db/init');
const authRoutes = require('@routes/auth');
const childrenRoutes = require('@routes/children');
const usersRoutes = require('@routes/users');
const classesRoutes = require('@routes/classes');
const schedulesRoutes = require('@routes/schedules');
const passwordResetRoutes = require('@routes/password-reset');
const messageRoutes = require('@routes/messages');

const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000', 'http://10.0.1.37:3000', process.env.FRONTEND_URL],
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database connection once
let dbInitialized = false;
const initDB = async () => {
  if (!dbInitialized) {
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

app.use('/api', passwordResetRoutes);
app.use('/api', authRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/schedules', schedulesRoutes);

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
