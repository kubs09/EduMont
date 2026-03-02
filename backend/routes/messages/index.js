import { Router } from 'express';
const router = Router();

let getRouter, createRouter, deleteRouter, usersRouter;

const resolveRouter = (moduleNamespace) => {
  let resolved = moduleNamespace;
  let maxDepth = 0;

  while (resolved && typeof resolved === 'object' && 'default' in resolved && maxDepth < 3) {
    resolved = resolved.default;
    maxDepth += 1;
  }

  return typeof resolved === 'function' ? resolved : null;
};

const loadOptionalRouter = async (relativePath) => {
  try {
    const moduleNamespace = await import(relativePath);
    return resolveRouter(moduleNamespace);
  } catch (error) {
    return null;
  }
};

getRouter = await loadOptionalRouter('./get.js');
createRouter = await loadOptionalRouter('./create.js');
deleteRouter = await loadOptionalRouter('./delete.js');
usersRouter = await loadOptionalRouter('./users.js');

async function initializeRouters() {
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
}

initializeRouters();

export default router;
