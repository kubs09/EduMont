/* eslint-disable */
require('module-alias/register');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

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

// Import modules with better error handling and fallback paths
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

const requireWithFallback = (aliasPath, relativePath) => {
  const fallbackPaths = [
    // Try relative to current file
    path.join(__dirname, '..', relativePath),
    // Try in the task root
    path.join('/var/task', relativePath),
    path.join('/var/task/backend', relativePath),
    // Try relative paths
    relativePath,
    `./${relativePath}`,
    `../${relativePath}`,
    path.join(__dirname, relativePath),
    path.join(process.cwd(), relativePath),
    path.join(process.cwd(), 'backend', relativePath),
  ];

  try {
    return require(aliasPath);
  } catch (error) {
    let lastError = error;
    for (const fallbackPath of fallbackPaths) {
      try {
        return require(fallbackPath);
      } catch (fallbackError) {
        lastError = fallbackError;
        continue;
      }
    }

    // Enhanced error message showing what directories exist
    const fs = require('fs');
    let dirInfo = '';
    try {
      const taskContents = fs.readdirSync('/var/task');
      const backendContents = fs.readdirSync('/var/task/backend');
      dirInfo = ` Task dir: [${taskContents.join(', ')}]. Backend dir: [${backendContents.join(
        ', '
      )}]`;
    } catch (fsError) {
      dirInfo = ` FS Error: ${fsError.message}`;
    }

    throw new Error(
      `Failed to load module: ${aliasPath} (${
        error.message
      }). Tried fallbacks: ${fallbackPaths.join(', ')}. Last error: ${lastError.message}.${dirInfo}`
    );
  }
};

try {
  pool = requireWithFallback('@config/database', 'config/database');
  initDatabase = requireWithFallback('@db/init', 'db/init');
  authRoutes = requireWithFallback('@routes/auth', 'routes/auth');
  childrenRoutes = requireWithFallback('@routes/children', 'routes/children');
  usersRoutes = requireWithFallback('@routes/users', 'routes/users');
  classesRoutes = requireWithFallback('@routes/classes', 'routes/classes');
  schedulesRoutes = requireWithFallback('@routes/schedules', 'routes/schedules');
  passwordResetRoutes = requireWithFallback('@routes/password-reset', 'routes/password-reset');
  messageRoutes = requireWithFallback('@routes/messages', 'routes/messages');
  modulesLoaded = true;
} catch (error) {
  console.error('Module import error:', error);
  moduleError = error.message;
}

// Add debug route that doesn't require database
app.get('/api/debug', (req, res) => {
  const fs = require('fs');
  let fileStructure = {};

  // Try to read directory structure for debugging
  const dirsToCheck = [__dirname, path.join(__dirname, '..'), process.cwd()];

  dirsToCheck.forEach((dir, index) => {
    try {
      const files = fs.readdirSync(dir);
      fileStructure[`dir${index}_${dir}`] = files;
    } catch (err) {
      fileStructure[`dir${index}_${dir}`] = `Error: ${err.message}`;
    }
  });

  res.json({
    message: 'Debug info',
    modulesLoaded,
    moduleError,
    __dirname,
    'process.cwd()': process.cwd(),
    fileStructure,
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
