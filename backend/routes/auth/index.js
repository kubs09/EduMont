/* eslint-disable */
const express = require('express');
const router = express.Router();

let loginRouter, signupRouter, passwordResetRouter;

try {
  loginRouter = require('./login');
} catch (error) {
  loginRouter = null;
}

try {
  signupRouter = require('./signup');
} catch (error) {
  signupRouter = null;
}

try {
  passwordResetRouter = require('./password-reset');
} catch (error) {
  passwordResetRouter = null;
}

if (loginRouter) router.use('/', loginRouter);
if (signupRouter) router.use('/', signupRouter);
if (passwordResetRouter) router.use('/', passwordResetRouter);

router.get('/auth-test', (req, res) => {
  res.json({
    message: 'Auth router is working',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
