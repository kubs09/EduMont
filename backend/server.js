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
  // First try the alias
  try {
    return require(aliasPath);
  } catch (aliasError) {
    // Then try relative to this file
    try {
      return require(path.join(__dirname, relativePath));
    } catch (relativeError) {
      throw new Error(
        `Failed to load module: ${aliasPath}. Alias error: ${aliasError.message}. Relative error: ${relativeError.message}`
      );
    }
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
  console.error('Current directory:', __dirname);
  console.error('Process cwd:', process.cwd());
  moduleError = error.message;
}

const app = express();

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://10.0.1.37:3000',
      process.env.FRONTEND_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      process.env.NODE_ENV === 'production' ? true : false,
    ].filter(Boolean),
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: '1mb' }));

// Ensure public directory exists and is properly referenced
const publicPath = path.join(__dirname, 'public');
try {
  app.use(express.static(publicPath));
} catch (err) {
  console.warn('Public directory not accessible:', publicPath);
}

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
  // For serverless, we need to handle database initialization differently
  if (process.env.VERCEL) {
    // In Vercel, initialize on first request rather than at startup
    let dbInitialized = false;
    let dbInitializing = false;

    app.use(async (req, res, next) => {
      // Skip initialization for non-API routes
      if (!req.path.startsWith('/api')) {
        return next();
      }

      if (dbInitialized) {
        return next();
      }

      // Prevent concurrent initialization attempts
      if (dbInitializing) {
        // Wait a bit and check again
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (dbInitialized) {
          return next();
        }
        return res.status(503).json({ error: 'Database is initializing, please retry' });
      }

      dbInitializing = true;
      try {
        console.log('Initializing database for serverless environment...');

        // Check if we're using Supabase
        if (process.env.USE_SUPABASE === 'true') {
          if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
            throw new Error(
              'Supabase configuration missing: SUPABASE_URL and SUPABASE_KEY required'
            );
          }
          console.log('Using Supabase database');
        } else {
          console.log('Using SQLite database at:', process.env.DB_PATH);
        }

        await pool.connect();
        await initDatabase();
        dbInitialized = true;
        dbInitializing = false;
        console.log('✅ Database initialized successfully');
        next();
      } catch (err) {
        dbInitializing = false;
        console.error('❌ Database initialization failed:', err);
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
          useSupabase: process.env.USE_SUPABASE,
          supabaseUrl: process.env.SUPABASE_URL ? 'set' : 'not set',
          dbPath: process.env.DB_PATH,
        });
        return res.status(500).json({
          error: 'Database initialization failed',
          message: err.message,
          details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        });
      }
    });
  } else {
    // Traditional server startup
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

// For Vercel serverless deployment
module.exports = app;

// Only start the server if this file is run directly (not in serverless environment)
if (require.main === module && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Modules loaded: ${modulesLoaded}`);
  });
}
