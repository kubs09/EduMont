/* eslint-disable */
const express = require('express');
const router = express.Router();

let getChildrenRouter, createChildRouter, updateChildRouter, deleteChildRouter;

// Load each module individually to identify which one is failing
try {
  getChildrenRouter = require('./get');
  console.log('✓ Get children router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load get children router:', error.message);
  getChildrenRouter = null;
}

try {
  createChildRouter = require('./create');
  console.log('✓ Create child router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load create child router:', error.message);
  createChildRouter = null;
}

try {
  updateChildRouter = require('./update');
  console.log('✓ Update child router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load update child router:', error.message);
  updateChildRouter = null;
}

try {
  deleteChildRouter = require('./delete');
  console.log('✓ Delete child router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load delete child router:', error.message);
  deleteChildRouter = null;
}

console.log('Children route modules loaded:', {
  getChildrenRouter: !!getChildrenRouter,
  createChildRouter: !!createChildRouter,
  updateChildRouter: !!updateChildRouter,
  deleteChildRouter: !!deleteChildRouter,
});

if (getChildrenRouter) router.use('/', getChildrenRouter);
if (createChildRouter) router.use('/', createChildRouter);
if (updateChildRouter) router.use('/', updateChildRouter);
if (deleteChildRouter) router.use('/', deleteChildRouter);

// Add a test route to verify this router is working
router.get('/test', (req, res) => {
  res.json({
    message: 'Children router is working',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
