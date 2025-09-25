/* eslint-disable */
const express = require('express');
const router = express.Router();

let loginRouter, signupRouter, passwordResetRouter;

// Load each module individually to identify which one is failing
try {
  loginRouter = require('./login');
  console.log('✓ Login router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load login router:', error.message);
  loginRouter = null;
}

try {
  signupRouter = require('./signup');
  console.log('✓ Signup router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load signup router:', error.message);
  signupRouter = null;
}

try {
  passwordResetRouter = require('./password-reset');
  console.log('✓ Password reset router loaded successfully');
} catch (error) {
  console.error('✗ Failed to load password reset router:', error.message);
  console.error('This is likely due to missing nodemailer dependency. Run: npm install nodemailer');
  passwordResetRouter = null;
}

console.log('Auth route modules loaded:', {
  loginRouter: !!loginRouter,
  signupRouter: !!signupRouter,
  passwordResetRouter: !!passwordResetRouter
});

if (loginRouter) router.use('/', loginRouter);
if (signupRouter) router.use('/', signupRouter);
if (passwordResetRouter) router.use('/', passwordResetRouter);

// Add a test route to verify this router is working
router.get('/auth-test', (req, res) => {
  res.json({ 
    message: 'Auth router is working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
