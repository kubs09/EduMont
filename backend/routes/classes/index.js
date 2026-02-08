/* eslint-disable */
const express = require('express');
const router = express.Router();

let getRouter, createRouter, updateRouter, deleteRouter, historyRouter, activitiesRouter, attendanceRouter;

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
  historyRouter = require('./history');
} catch (error) {
  historyRouter = null;
}

try {
  activitiesRouter = require('./activities');
} catch (error) {
  activitiesRouter = null;
}

try {
  attendanceRouter = require('./attendance');
} catch (error) {
  attendanceRouter = null;
}

if (getRouter) router.use('/', getRouter);
if (createRouter) router.use('/', createRouter);
if (updateRouter) router.use('/', updateRouter);
if (deleteRouter) router.use('/', deleteRouter);
if (historyRouter) router.use('/', historyRouter);
if (activitiesRouter) router.use('/', activitiesRouter);
if (attendanceRouter) router.use('/', attendanceRouter);

router.get('/test', (req, res) => {
  res.json({
    message: 'Classes router is working',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
