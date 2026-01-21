/* eslint-disable */
const express = require('express');
const router = express.Router();

const listRouter = require('./list');
const profileRouter = require('./profile');
const invitationsRouter = require('./invitations');
const deleteRouter = require('./delete');

router.use('/', listRouter);
router.use('/', profileRouter);
router.use('/', invitationsRouter);
router.use('/', deleteRouter);

module.exports = router;
