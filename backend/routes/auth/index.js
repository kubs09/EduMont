/* eslint-disable */
const express = require('express');
const router = express.Router();

const loginRouter = require('./login');
const signupRouter = require('./signup');
const passwordResetRouter = require('./password-reset');

router.use('/', loginRouter);
router.use('/', signupRouter);
router.use('/', passwordResetRouter);

module.exports = router;
