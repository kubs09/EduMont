/* eslint-disable */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const pool = require('./config/database');
const initDatabase = require('./db/init');
const authRoutes = require('./routes/auth');
const childrenRoutes = require('./routes/children');
const usersRoutes = require('./routes/users');
const passwordResetRoutes = require('./routes/password-reset');

const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000', 'http://10.0.1.37:3000', process.env.FRONTEND_URL],
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Connect to database
pool
  .connect()
  .then(() => {
    return initDatabase();
  })
  .catch((err) => {
    process.exit(1);
  });

// Add before routes
app.use((req, res, next) => {
  next();
});

// Error handler for JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next(err);
});

// Routes
app.use('/api', authRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/classes', require('./routes/classes'));
app.use('/api/messages', require('./routes/messages')); // Add messages routes
app.use('/api', passwordResetRoutes);

// Catch-all handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.DEBUG === 'true' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
