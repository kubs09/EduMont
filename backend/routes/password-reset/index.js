/* eslint-disable */
const express = require('express');
const router = express.Router();

let forgotPasswordRouter, checkTokenRouter, resetPasswordRouter;

try {
  forgotPasswordRouter = require('./forgot-password');
} catch (error) {
  forgotPasswordRouter = null;
}

try {
  checkTokenRouter = require('./check-token');
} catch (error) {
  checkTokenRouter = null;
}

try {
  resetPasswordRouter = require('./reset-password');
} catch (error) {
  resetPasswordRouter = null;
}

if (forgotPasswordRouter) router.use('/', forgotPasswordRouter);
if (checkTokenRouter) router.use('/', checkTokenRouter);
if (resetPasswordRouter) router.use('/', resetPasswordRouter);

router.get('/test', (req, res) => {
  res.json({
    message: 'Password reset router is working',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
