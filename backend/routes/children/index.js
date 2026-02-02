/* eslint-disable */
const express = require('express');
const router = express.Router();

let getChildrenRouter, createChildRouter, updateChildRouter, deleteChildRouter;

try {
  getChildrenRouter = require('./get');
} catch (error) {
  getChildrenRouter = null;
}

try {
  createChildRouter = require('./create');
} catch (error) {
  createChildRouter = null;
}

try {
  updateChildRouter = require('./update');
} catch (error) {
  updateChildRouter = null;
}

try {
  deleteChildRouter = require('./delete');
} catch (error) {
  deleteChildRouter = null;
}

if (getChildrenRouter) router.use('/', getChildrenRouter);
if (createChildRouter) router.use('/', createChildRouter);
if (updateChildRouter) router.use('/', updateChildRouter);
if (deleteChildRouter) router.use('/', deleteChildRouter);

router.get('/test', (req, res) => {
  res.json({
    message: 'Children router is working',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
