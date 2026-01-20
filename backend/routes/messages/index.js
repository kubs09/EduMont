/* eslint-disable */
const express = require('express');
const router = express.Router();

let getRouter, createRouter, deleteRouter, usersRouter;

// Load each module individually to identify which one is failing
try {
  getRouter = require('./get');
  console.log('✓ Get messages router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load get messages router:', error.message);
  getRouter = null;
}

try {
  createRouter = require('./create');
  console.log('✓ Create message router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load create message router:', error.message);
  createRouter = null;
}

try {
  deleteRouter = require('./delete');
  console.log('✓ Delete message router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load delete message router:', error.message);
  deleteRouter = null;
}

try {
  usersRouter = require('./users');
  console.log('✓ Message users router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load message users router:', error.message);
  usersRouter = null;
}

console.log('Messages route modules loaded:', {
  getRouter: !!getRouter,
  createRouter: !!createRouter,
  deleteRouter: !!deleteRouter,
  usersRouter: !!usersRouter
});

if (getRouter) router.use('/', getRouter);
if (createRouter) router.use('/', createRouter);
if (deleteRouter) router.use('/', deleteRouter);
if (usersRouter) router.use('/', usersRouter);

// Add a test route to verify this router is working
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Messages router is working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
