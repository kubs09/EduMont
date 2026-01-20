/* eslint-disable */
const express = require('express');
const router = express.Router();

let getRouter, createRouter, updateRouter, deleteRouter, validationHelpers;

// Load each module individually to identify which one is failing
try {
  validationHelpers = require('./validation');
  console.log('✓ Schedule validation helpers loaded successfully');
} catch (error) {
  console.error('✗ Failed to load schedule validation helpers:', error.message);
  validationHelpers = null;
}

try {
  getRouter = require('./get');
  console.log('✓ Get schedules router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load get schedules router:', error.message);
  getRouter = null;
}

try {
  createRouter = require('./create');
  console.log('✓ Create schedule router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load create schedule router:', error.message);
  createRouter = null;
}

try {
  updateRouter = require('./update');
  console.log('✓ Update schedule router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load update schedule router:', error.message);
  updateRouter = null;
}

try {
  deleteRouter = require('./delete');
  console.log('✓ Delete schedule router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load delete schedule router:', error.message);
  deleteRouter = null;
}

console.log('Schedules route modules loaded:', {
  validationHelpers: !!validationHelpers,
  getRouter: !!getRouter,
  createRouter: !!createRouter,
  updateRouter: !!updateRouter,
  deleteRouter: !!deleteRouter,
});

if (getRouter) router.use('/', getRouter);
if (createRouter) router.use('/', createRouter);
if (updateRouter) router.use('/', updateRouter);
if (deleteRouter) router.use('/', deleteRouter);

// Add a test route to verify this router is working
router.get('/test', (req, res) => {
  res.json({
    message: 'Schedules router is working',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
