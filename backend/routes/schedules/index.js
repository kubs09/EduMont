/* eslint-disable */
const express = require('express');
const router = express.Router();

let getRouter, createRouter, updateRouter, deleteRouter, validationHelpers;

try {
  validationHelpers = require('./validation');
} catch (error) {
  validationHelpers = null;
}

try {
  getRouter = require('./get');
} catch (error) {
  getRouter = null;
}

try {
  createRouter = require('./create');
} catch (error) {
  createRouter = null;
}

try {
  updateRouter = require('./update');
} catch (error) {
  updateRouter = null;
}

try {
  deleteRouter = require('./delete');
} catch (error) {
  deleteRouter = null;
}

if (getRouter) router.use('/', getRouter);
if (createRouter) router.use('/', createRouter);
if (updateRouter) router.use('/', updateRouter);
if (deleteRouter) router.use('/', deleteRouter);

router.get('/test', (req, res) => {
  res.json({
    message: 'Schedules router is working',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
