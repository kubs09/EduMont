/* eslint-disable */
require('module-alias/register');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

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
    relativePath,
    `./${relativePath}`,
    `../${relativePath}`,
    path.join(__dirname, relativePath),
    path.join(__dirname, '..', relativePath),
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
    throw new Error(
      `Failed to load module: ${aliasPath} (${error.message}). Tried fallbacks: ${fallbackPaths.join(
        ', '
      )}. Last error: ${lastError.message}`
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
  passwordResetRoutes = requireWithFallback(
    '@routes/password-reset',
    'routes/password-reset'
  );
  messageRoutes = requireWithFallback('@routes/messages', 'routes/messages');
  modulesLoaded = true;
} catch (error) {
  console.error('Module import error:', error);
  moduleError = error.message;
}

const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000', 'http://10.0.1.37:3000', process.env.FRONTEND_URL],
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Add debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'Debug info',
    modulesLoaded,
    moduleError,
    __dirname,
    'process.cwd()': process.cwd(),
    timestamp: new Date().toISOString(),
  });
});

// Initialize database only if modules loaded successfully
if (modulesLoaded && pool && initDatabase) {
  pool
    .connect()
    .then(() => {
      return initDatabase();
    })
    .catch((err) => {
      console.error('Database initialization failed:', err);
      process.exit(1);
    });
}

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

// Routes - only mount if modules loaded successfully
if (modulesLoaded) {
  if (passwordResetRoutes) app.use('/api', passwordResetRoutes);
  if (authRoutes) app.use('/api', authRoutes);
  if (childrenRoutes) app.use('/api/children', childrenRoutes);
  if (usersRoutes) app.use('/api/users', usersRoutes);
  if (classesRoutes) app.use('/api/classes', classesRoutes);
  if (messageRoutes) app.use('/api/messages', messageRoutes);
  if (schedulesRoutes) app.use('/api/schedules', schedulesRoutes);
} else {
  // Add fallback routes when modules aren't loaded
  app.get('/api/*', (req, res) => {
    res.status(500).json({
      error: 'Server modules not loaded',
      details: moduleError,
    });
  });
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

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
