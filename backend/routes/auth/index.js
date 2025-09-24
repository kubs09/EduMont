/* eslint-disable */
const express = require('express');
const router = express.Router();

let loginRouter, signupRouter, passwordResetRouter;

try {
  loginRouter = require('./login');
  signupRouter = require('./signup');
  passwordResetRouter = require('./password-reset');
  
  console.log('Auth route modules loaded:', {
    loginRouter: !!loginRouter,
    signupRouter: !!signupRouter,
    passwordResetRouter: !!passwordResetRouter
  });
} catch (error) {
  console.error('Error loading auth route modules:', error);
}

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
