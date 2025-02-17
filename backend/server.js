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
const admissionRoutes = require('./routes/admission');
const messagesRoutes = require('./routes/messages');
const classesRoutes = require('./routes/classes');

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

app.use((req, res, next) => {
  next();
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/admission', admissionRoutes);

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

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
