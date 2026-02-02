/* eslint-disable */
const express = require('express');
const router = express.Router();

let getRouter, createRouter, deleteRouter, usersRouter;

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
  deleteRouter = require('./delete');
} catch (error) {
  deleteRouter = null;
}

try {
  usersRouter = require('./users');
} catch (error) {
  usersRouter = null;
}

if (usersRouter) router.use('/', usersRouter);
if (getRouter) router.use('/', getRouter);
if (createRouter) router.use('/', createRouter);
if (deleteRouter) router.use('/', deleteRouter);

router.get('/test', (req, res) => {
  res.json({
    message: 'Messages router is working',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
