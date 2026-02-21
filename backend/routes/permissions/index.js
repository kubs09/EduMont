/* eslint-disable */
const express = require('express');
const router = express.Router();

const requestRoute = require('./request');

router.use('/', requestRoute);

module.exports = router;
