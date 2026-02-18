/* eslint-disable */
const express = require('express');
const router = express.Router();

let getRouter,
  createRouter,
  updateRouter,
  deleteRouter,
  validationHelpers,
  categoriesGetRouter,
  categoriesCreateRouter,
  categoriesUpdateRouter,
  categoriesDeleteRouter,
  statusRouter,
  nextPresentationsRouter;

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
  categoriesGetRouter = require('./categories-get');
} catch (error) {
  categoriesGetRouter = null;
}

try {
  categoriesCreateRouter = require('./categories-create');
} catch (error) {
  categoriesCreateRouter = null;
}

try {
  categoriesUpdateRouter = require('./categories-update');
} catch (error) {
  categoriesUpdateRouter = null;
}

try {
  categoriesDeleteRouter = require('./categories-delete');
} catch (error) {
  categoriesDeleteRouter = null;
}

try {
  statusRouter = require('./status');
} catch (error) {
  statusRouter = null;
}

try {
  nextPresentationsRouter = require('./next-presentations');
} catch (error) {
  nextPresentationsRouter = null;
}

if (getRouter) router.use('/', getRouter);
if (createRouter) router.use('/', createRouter);
if (updateRouter) router.use('/', updateRouter);
if (deleteRouter) router.use('/', deleteRouter);
if (categoriesGetRouter) router.use('/', categoriesGetRouter);
if (categoriesCreateRouter) router.use('/', categoriesCreateRouter);
if (categoriesUpdateRouter) router.use('/', categoriesUpdateRouter);
if (categoriesDeleteRouter) router.use('/', categoriesDeleteRouter);
if (statusRouter) router.use('/', statusRouter);
if (nextPresentationsRouter) router.use('/', nextPresentationsRouter);

router.get('/test', (req, res) => {
  res.json({
    message: 'presentations router is working',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
