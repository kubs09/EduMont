import { Router } from 'express';
import console from 'console';

let getRouter = null;
let createRouter = null;
let updateRouter = null;
let deleteRouter = null;
let uploadUrlRouter = null;

try {
  const module = await import('./get.js');
  getRouter = module.default;
} catch (error) {
  getRouter = null;
}

try {
  const module = await import('./create.js');
  createRouter = module.default;
} catch (error) {
  createRouter = null;
}

try {
  const module = await import('./update.js');
  updateRouter = module.default || module;
} catch (error) {
  updateRouter = null;
}

try {
  const module = await import('./delete.js');
  deleteRouter = module.default;
} catch (error) {
  deleteRouter = null;
}

try {
  const module = await import('./upload-url.js');
  uploadUrlRouter = module.default;
} catch (error) {
  uploadUrlRouter = null;
}

const router = Router();

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

export default router;
