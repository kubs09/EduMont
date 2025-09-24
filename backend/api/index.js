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

console.log('Module loading status:', {
  pool: !!pool,
  initDatabase: !!initDatabase,
  authRoutes: !!authRoutes,
  childrenRoutes: !!childrenRoutes,
  usersRoutes: !!usersRoutes,
  classesRoutes: !!classesRoutes,
  schedulesRoutes: !!schedulesRoutes,
  passwordResetRoutes: !!passwordResetRoutes,
  messageRoutes: !!messageRoutes,
});

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
    availableRoutes: ['POST /login', 'GET /test', 'GET /debug', 'GET /auth-test'],
    authRoutesLoaded: !!authRoutes,
    allModulesStatus: {
      pool: !!pool,
      initDatabase: !!initDatabase,
      authRoutes: !!authRoutes,
      childrenRoutes: !!childrenRoutes,
      usersRoutes: !!usersRoutes,
      classesRoutes: !!classesRoutes,
      schedulesRoutes: !!schedulesRoutes,
      passwordResetRoutes: !!passwordResetRoutes,
      messageRoutes: !!messageRoutes,
    },
    timestamp: new Date().toISOString(),
  });
});
