/* eslint-disable */
const express = require('express');
const router = express.Router();

let getRouter, createRouter, updateRouter, deleteRouter, uploadUrlRouter, validationHelpers;

try {
  validationHelpers = require('./validation');
  console.log('✓ Document validation helpers loaded successfully');
} catch (error) {
  console.error('✗ Failed to load document validation helpers:', error.message);
  validationHelpers = null;
}

try {
  getRouter = require('./get');
  console.log('✓ Get documents router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load get documents router:', error.message);
  getRouter = null;
}

try {
  createRouter = require('./create');
  console.log('✓ Create document router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load create document router:', error.message);
  createRouter = null;
}

try {
  updateRouter = require('./update');
  console.log('✓ Update document router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load update document router:', error.message);
  updateRouter = null;
}

try {
  deleteRouter = require('./delete');
  console.log('✓ Delete document router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load delete document router:', error.message);
  deleteRouter = null;
}

try {
  uploadUrlRouter = require('./upload-url');
  console.log('✓ Upload URL router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load upload URL router:', error.message);
  uploadUrlRouter = null;
}

console.log('Documents route modules loaded:', {
  validationHelpers: !!validationHelpers,
  getRouter: !!getRouter,
  createRouter: !!createRouter,
  updateRouter: !!updateRouter,
  deleteRouter: !!deleteRouter,
  uploadUrlRouter: !!uploadUrlRouter,
});

if (uploadUrlRouter) {
  console.log('📄 Mounting upload-url router at /api/documents/upload-url');
  router.use('/upload-url', uploadUrlRouter);
} else {
  console.warn('⚠️ uploadUrlRouter not loaded!');
}
if (getRouter) router.use('/', getRouter);
if (createRouter) router.use('/', createRouter);
if (updateRouter) router.use('/', updateRouter);
if (deleteRouter) router.use('/', deleteRouter);

router.get('/test', (req, res) => {
  res.json({
    message: 'Documents router is working',
    timestamp: new Date().toISOString(),
  });
});

// Debug endpoint to check if upload-url route is registered
router.get('/debug-routes', (req, res) => {
  res.json({
    message: 'Documents routes debug info',
    uploadUrlRouterLoaded: !!uploadUrlRouter,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
