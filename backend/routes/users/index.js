/* eslint-disable */
const express = require('express');
const router = express.Router();

const listRouter = require('./list');
const profileRouter = require('./profile');
const invitationsRouter = require('./invitations');

router.use('/', listRouter);
router.use('/', profileRouter);
router.use('/', invitationsRouter);

module.exports = router;
