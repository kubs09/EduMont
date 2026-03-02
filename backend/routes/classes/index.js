import { Router } from 'express';
import getRouterModule from './get.js';
import createRouterModule from './create.js';
import updateRouterModule from './update.js';
import deleteRouterModule from './delete.js';
import historyRouterModule from './history.js';
import attendanceRouterModule from './attendance.js';

const router = Router();

let getRouter = getRouterModule || null;
let createRouter = createRouterModule || null;
let updateRouter = (updateRouterModule && updateRouterModule.default) || null;
let deleteRouter = deleteRouterModule || null;
let historyRouter = historyRouterModule || null;
let attendanceRouter = attendanceRouterModule || null;

if (getRouter) router.use('/', getRouter);
if (createRouter) router.use('/', createRouter);
if (updateRouter) router.use('/', updateRouter);
if (deleteRouter) router.use('/', deleteRouter);
if (historyRouter) router.use('/', historyRouter);
if (attendanceRouter) router.use('/', attendanceRouter);

router.get('/test', (req, res) => {
  res.json({
    message: 'Classes router is working',
    timestamp: new Date().toISOString(),
  });
});

export default router;
