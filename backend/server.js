/* eslint-disable */
// Vercel deployment - Fixed API routing and database configuration
require('module-alias/register');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

let pool,
  initDatabase,
  authRoutes,
  childrenRoutes,
  usersRoutes,
  classesRoutes,
  schedulesRoutes,
  documentsRoutes,
  passwordResetRoutes,
  messageRoutes,
  categoryPresentationsRoutes;

let modulesLoaded = false;
let moduleError = null;

const requireWithFallback = (aliasPath, relativePath) => {
  try {
    return require(aliasPath);
  } catch (aliasError) {
    try {
      return require(path.join(__dirname, relativePath));
    } catch (relativeError) {
      throw new Error(
        `Failed to load module: ${aliasPath}. Alias error: ${aliasError.message}. Relative error: ${relativeError.message}`
      );
    }
  }
};

const lazyLoadModules = () => {
  if (modulesLoaded || moduleError) return;

  try {
    pool = requireWithFallback('@config/database', 'config/database');
    initDatabase = requireWithFallback('@db/init', 'db/init');
    authRoutes = requireWithFallback('@routes/auth', 'routes/auth');
    childrenRoutes = requireWithFallback('@routes/children', 'routes/children');
    usersRoutes = requireWithFallback('@routes/users', 'routes/users');
    classesRoutes = requireWithFallback('@routes/classes', 'routes/classes');
    schedulesRoutes = requireWithFallback('@routes/schedules', 'routes/schedules');
    documentsRoutes = requireWithFallback('@routes/documents', 'routes/documents');
    passwordResetRoutes = requireWithFallback('@routes/password-reset', 'routes/password-reset');
    messageRoutes = requireWithFallback('@routes/messages', 'routes/messages');
    categoryPresentationsRoutes = requireWithFallback(
      '@routes/category-presentations',
      'routes/category-presentations'
    );
    modulesLoaded = true;
  } catch (error) {
    moduleError = error.message;
  }
};

if (process.env.VERCEL === 'true' || process.env.NODE_ENV !== 'production') {
  lazyLoadModules();
}

const app = express();

const corsOrigins = ['http://localhost:3000', 'http://localhost:3001'].filter(Boolean);

if (process.env.FRONTEND_URL) corsOrigins.push(process.env.FRONTEND_URL);
if (process.env.VERCEL_URL) corsOrigins.push(`https://${process.env.VERCEL_URL}`);

if (!(process.env.VERCEL === 'true' || process.env.NODE_ENV === 'production')) {
  if (process.env.INCLUDE_DEV_URLS) {
    corsOrigins.push('http://10.0.1.37:3000');
  }
}

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(bodyParser.json({ limit: '10mb' }));

const publicPath = path.join(__dirname, 'public');
try {
  app.use(express.static(publicPath));
} catch (err) {
  console.warn('Public directory not accessible:', publicPath);
}

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV === 'development') {
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
}

app.use('/api', (req, res, next) => {
  if (process.env.VERCEL === 'true') {
    lazyLoadModules();
  }
  next();
});

if (modulesLoaded && pool && initDatabase) {
  if (process.env.VERCEL) {
    let dbInitialized = false;
    let dbInitializing = false;

    app.use(async (req, res, next) => {
      if (!req.path.startsWith('/api')) {
        return next();
      }

      if (dbInitialized) {
        return next();
      }

      if (dbInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (dbInitialized) {
          return next();
        }
        return res.status(503).json({ error: 'Database is initializing, please retry' });
      }

      dbInitializing = true;
      try {
        if (process.env.USE_SUPABASE === 'true') {
          if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            throw new Error(
              'Supabase configuration missing: SUPABASE_URL and SUPABASE_ANON_KEY required'
            );
          }
        } else {
        }

        await initDatabase();
        dbInitialized = true;
        dbInitializing = false;
        next();
      } catch (err) {
        dbInitializing = false;
        return res.status(500).json({
          error: 'Database initialization failed',
          message: err.message,
          details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        });
      }
    });
  } else {
    initDatabase().catch((err) => {
      process.exit(1);
    });
  }
}

app.use((req, res, next) => {
  next();
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next(err);
});

let routesMounted = false;
const mountRoutes = () => {
  if (routesMounted) return;

  if (passwordResetRoutes) app.use('/api', passwordResetRoutes);
  if (authRoutes) app.use('/api', authRoutes);
  if (childrenRoutes) app.use('/api/children', childrenRoutes);
  if (usersRoutes) app.use('/api/users', usersRoutes);
  if (classesRoutes) app.use('/api/classes', classesRoutes);
  if (messageRoutes) app.use('/api/messages', messageRoutes);
  if (schedulesRoutes) app.use('/api/schedules', schedulesRoutes);
  if (categoryPresentationsRoutes)
    app.use('/api/category-presentations', categoryPresentationsRoutes);
  if (documentsRoutes) {
    app.use('/api/documents', documentsRoutes);
  } else {
    console.warn('⚠️ documentsRoutes not available!');
  }
  routesMounted = true;
};

if (modulesLoaded) {
  mountRoutes();
}

app.use('/api', (req, res, next) => {
  if (!modulesLoaded) {
    return res.status(500).json({
      error: 'Server modules not loaded',
      details: moduleError || 'Modules still loading',
    });
  }

  if (!routesMounted && modulesLoaded) {
    mountRoutes();
  }

  next();
});

if (modulesLoaded) {
  mountRoutes();
}

app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

module.exports = app;

if (require.main === module && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {});
}
