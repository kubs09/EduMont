/* eslint-disable */
const express = require('express');
const router = express.Router();

let forgotPasswordRouter, checkTokenRouter, resetPasswordRouter;

// Load each module individually to identify which one is failing
try {
  forgotPasswordRouter = require('./forgot-password');
  console.log('✓ Forgot password router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load forgot password router:', error.message);
  forgotPasswordRouter = null;
}

try {
  checkTokenRouter = require('./check-token');
  console.log('✓ Check token router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load check token router:', error.message);
  checkTokenRouter = null;
}

try {
  resetPasswordRouter = require('./reset-password');
  console.log('✓ Reset password router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load reset password router:', error.message);
  resetPasswordRouter = null;
}

console.log('Password reset route modules loaded:', {
  forgotPasswordRouter: !!forgotPasswordRouter,
  checkTokenRouter: !!checkTokenRouter,
  resetPasswordRouter: !!resetPasswordRouter,
});

if (forgotPasswordRouter) router.use('/', forgotPasswordRouter);
if (checkTokenRouter) router.use('/', checkTokenRouter);
if (resetPasswordRouter) router.use('/', resetPasswordRouter);

// Add a test route to verify this router is working
router.get('/test', (req, res) => {
  res.json({
    message: 'Password reset router is working',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
