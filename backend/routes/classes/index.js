/* eslint-disable */
const express = require('express');
const router = express.Router();

let getRouter,
  createRouter,
  updateRouter,
  deleteRouter,
  confirmRouter,
  historyRouter,
  activitiesRouter;

// Load each module individually to identify which one is failing
try {
  getRouter = require('./get');
  console.log('✓ Get classes router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load get classes router:', error.message);
  getRouter = null;
}

try {
  createRouter = require('./create');
  console.log('✓ Create class router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load create class router:', error.message);
  createRouter = null;
}

try {
  updateRouter = require('./update');
  console.log('✓ Update class router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load update class router:', error.message);
  updateRouter = null;
}

try {
  deleteRouter = require('./delete');
  console.log('✓ Delete class router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load delete class router:', error.message);
  deleteRouter = null;
}

try {
  confirmRouter = require('./confirm');
  console.log('✓ Confirm class router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load confirm class router:', error.message);
  confirmRouter = null;
}

try {
  historyRouter = require('./history');
  console.log('✓ History class router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load history class router:', error.message);
  historyRouter = null;
}

try {
  activitiesRouter = require('./activities');
  console.log('✓ Activities class router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load activities class router:', error.message);
  activitiesRouter = null;
}

console.log('Classes route modules loaded:', {
  getRouter: !!getRouter,
  createRouter: !!createRouter,
  updateRouter: !!updateRouter,
  deleteRouter: !!deleteRouter,
  confirmRouter: !!confirmRouter,
  historyRouter: !!historyRouter,
  activitiesRouter: !!activitiesRouter,
});

if (getRouter) router.use('/', getRouter);
if (createRouter) router.use('/', createRouter);
if (updateRouter) router.use('/', updateRouter);
if (deleteRouter) router.use('/', deleteRouter);
if (confirmRouter) router.use('/', confirmRouter);
if (historyRouter) router.use('/', historyRouter);
if (activitiesRouter) router.use('/', activitiesRouter);

// Add a test route to verify this router is working
router.get('/test', (req, res) => {
  res.json({
    message: 'Classes router is working',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
