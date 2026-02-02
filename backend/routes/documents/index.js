/* eslint-disable */
const express = require('express');
const router = express.Router();

let getRouter, createRouter, updateRouter, deleteRouter, uploadUrlRouter, validationHelpers;

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

try {
  uploadUrlRouter = require('./upload-url');
} catch (error) {
  uploadUrlRouter = null;
}

if (uploadUrlRouter) {
  router.use('/upload-url', uploadUrlRouter);
} else {
  console.warn('⚠️ uploadUrlRouter not loaded!');
}
if (getRouter) router.use('/', getRouter);
if (createRouter) router.use('/', createRouter);
if (updateRouter) router.use('/', updateRouter);
if (deleteRouter) router.use('/', deleteRouter);

router.get('/test', (req, res) => {
  res.json({
    message: 'Documents router is working',
    timestamp: new Date().toISOString(),
  });
});

router.get('/debug-routes', (req, res) => {
  res.json({
    message: 'Documents routes debug info',
    uploadUrlRouterLoaded: !!uploadUrlRouter,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
