import 'dotenv/config';
import process from 'process';
import express from 'express';
import cors from 'cors';
import pkg from 'body-parser';
import { join } from 'path';
import { URL } from 'url';
import console from 'console';
import { setTimeout } from 'timers/promises';
import { fileURLToPath } from 'url';

const { json } = pkg;
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const __filename = fileURLToPath(import.meta.url);

let pool,
  initDatabase,
  authRoutes,
  childrenRoutes,
  usersRoutes,
  classesRoutes,
  presentationsRoutes,
  documentsRoutes,
  passwordResetRoutes,
  messageRoutes,
  permissionsRoutes;

let modulesLoaded = false;
let moduleError = null;
let dbInitPromise = null;
const isVercel = process.env.VERCEL === 'true';

const ensureDatabaseInitialized = async () => {
  if (!pool || !initDatabase) return;

  if (!dbInitPromise) {
    dbInitPromise = initDatabase().catch((error) => {
      dbInitPromise = null;
      throw error;
    });
  }

  await dbInitPromise;
};

const importWithFallback = async (relativePath) => {
  try {
    return await import(new URL(relativePath, import.meta.url));
  } catch (error) {
    throw new Error(`Failed to load module ${relativePath}: ${error.message}`);
  }
};

const resolveModuleExport = (moduleNamespace) => {
  let resolved = moduleNamespace;
  let maxDepth = 0;

  while (resolved && typeof resolved === 'object' && 'default' in resolved && maxDepth < 3) {
    resolved = resolved.default;
    maxDepth += 1;
  }

  return resolved;
};

const resolveRouter = (moduleNamespace) => {
  const resolved = resolveModuleExport(moduleNamespace);
  return typeof resolved === 'function' ? resolved : null;
};

const lazyLoadModules = async () => {
  if (modulesLoaded) return;

  const moduleLoadErrors = [];
  const loadOptional = async (relativePath) => {
    try {
      return await importWithFallback(relativePath);
    } catch (error) {
      const errorMsg = `${relativePath}: ${error.message}`;
      console.error('❌ Failed to load module:', errorMsg);
      moduleLoadErrors.push(errorMsg);
      return null;
    }
  };

  pool = resolveModuleExport(await loadOptional('./config/database.js'));
  if (!pool) {
    console.error('🔴 CRITICAL: Database pool failed to initialize');
  } else {
    console.log('✅ Database pool initialized');
  }

  initDatabase = resolveModuleExport(await loadOptional('./db/init.js'));
  authRoutes = resolveRouter(await loadOptional('./routes/auth/index.js'));
  childrenRoutes = resolveRouter(await loadOptional('./routes/children/index.js'));
  usersRoutes = resolveRouter(await loadOptional('./routes/users/index.js'));
  classesRoutes = resolveRouter(await loadOptional('./routes/classes/index.js'));
  presentationsRoutes = resolveRouter(await loadOptional('./routes/presentations/index.js'));
  documentsRoutes = resolveRouter(await loadOptional('./routes/documents/index.js'));
  passwordResetRoutes = resolveRouter(await loadOptional('./routes/password-reset/index.js'));
  messageRoutes = resolveRouter(await loadOptional('./routes/messages/index.js'));
  permissionsRoutes = resolveRouter(await loadOptional('./routes/permissions/index.js'));

  moduleError = moduleLoadErrors.length ? moduleLoadErrors.join(' | ') : null;
  if (moduleError) {
    console.error('🔴 Module loading errors:', moduleError);
  }
  modulesLoaded = true;
};

if (isVercel || process.env.NODE_ENV !== 'production') {
  try {
    await lazyLoadModules();
  } catch (error) {
    console.error('❌ Failed to load modules during initialization:', error.message);
    moduleError = error.message;
    // Continue anyway - modules will be loaded on first request
  }
}

const app = express();
const apiRouter = express.Router();

const corsOrigins = ['http://localhost:3000', 'http://localhost:3001'].filter(Boolean);

if (process.env.FRONTEND_URL) corsOrigins.push(process.env.FRONTEND_URL);
if (process.env.VERCEL_URL) corsOrigins.push(`https://${process.env.VERCEL_URL}`);

if (!(isVercel || process.env.NODE_ENV === 'production')) {
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
app.use(json({ limit: '10mb' }));

const publicPath = join(__dirname, 'public');
try {
  app.use(express.static(publicPath));
} catch (err) {
  console.warn('Public directory not accessible:', publicPath);
}

app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'running',
    modulesLoaded,
    poolAvailable: !!pool,
  };

  // Try to test database connection
  if (pool && typeof pool.query === 'function') {
    try {
      await pool.query('SELECT NOW() as now');
      health.database = 'connected';
    } catch (err) {
      health.database = 'error';
      health.databaseError = process.env.NODE_ENV === 'development' ? err.message : undefined;
    }
  } else {
    health.database = 'unavailable';
    health.databaseError =
      process.env.NODE_ENV === 'development' ? moduleError || 'Pool not initialized' : undefined;
  }

  const statusCode = health.database === 'connected' ? 200 : 503;
  res.status(statusCode).json(health);
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

app.use('/api', async (req, res, next) => {
  try {
    if (!modulesLoaded) {
      try {
        await lazyLoadModules();
      } catch (error) {
        console.error('❌ Failed to load modules on request:', error.message);
        moduleError = error.message;
      }
    }

    // Check if pool is available
    if (!pool) {
      console.warn('⚠️ Pool not available - returning 503');
      return res.status(503).json({
        error: 'Database not available',
        message: 'Database pool failed to initialize',
        details: process.env.NODE_ENV === 'development' ? moduleError : undefined,
      });
    }

    next();
  } catch (error) {
    console.error('🔴 Middleware error:', error);
    next(error);
  }
});

if (!isVercel && modulesLoaded && pool && initDatabase) {
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
      await setTimeout(100);
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
        /* empty */
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
  ensureDatabaseInitialized().catch((error) => {
    console.error('Database initialization error:', error);
    if (!isVercel) {
      process.exit(1);
    }
  });
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

  if (passwordResetRoutes) apiRouter.use('/', passwordResetRoutes);
  if (authRoutes) apiRouter.use('/', authRoutes);
  if (childrenRoutes) apiRouter.use('/children', childrenRoutes);
  if (usersRoutes) apiRouter.use('/users', usersRoutes);
  if (classesRoutes) apiRouter.use('/classes', classesRoutes);
  if (messageRoutes) apiRouter.use('/messages', messageRoutes);
  if (presentationsRoutes) apiRouter.use('/presentations', presentationsRoutes);
  if (permissionsRoutes) apiRouter.use('/permissions', permissionsRoutes);
  if (documentsRoutes) {
    apiRouter.use('/documents', documentsRoutes);
  } else {
    console.warn('⚠️ documentsRoutes not available!');
  }
  routesMounted = true;
};

if (modulesLoaded) {
  mountRoutes();
}

app.use('/api', async (req, res, next) => {
  try {
    if (!modulesLoaded) {
      await lazyLoadModules();
    }

    if (!process.env.VERCEL && modulesLoaded && pool && initDatabase) {
      await ensureDatabaseInitialized();
    }

    if (!routesMounted && modulesLoaded) {
      mountRoutes();
    }

    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  void next;
  console.error('🔴 Unhandled error:', {
    name: err.name,
    message: err.message,
    code: err.code,
    path: req.path,
    method: req.method,
  });

  if (err.code && ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].includes(err.code)) {
    return res.status(503).json({
      error: 'Database connection failed',
      message: `Cannot connect to database: ${err.message}`,
      code: err.code,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

export default app;

if (process.argv[1] === __filename && !isVercel) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
