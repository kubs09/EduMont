/* eslint-disable */
const express = require('express');
const router = express.Router();

const requestRoute = require('./request');
const updateRoute = require('./update');

router.use('/', requestRoute);
router.use('/', updateRoute);

module.exports = router;
