import { Router } from 'express';
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

const router = Router();

let getChildrenRouter, createChildRouter, updateChildRouter, deleteChildRouter, excusesRouter;

getChildrenRouter = await loadOptionalRouter('./get.js');
createChildRouter = await loadOptionalRouter('./create.js');
updateChildRouter = await loadOptionalRouter('./update.js');
deleteChildRouter = await loadOptionalRouter('./delete.js');
excusesRouter = await loadOptionalRouter('./excuses.js');

if (getChildrenRouter) router.use('/', getChildrenRouter);
if (createChildRouter) router.use('/', createChildRouter);
if (updateChildRouter) router.use('/', updateChildRouter);
if (deleteChildRouter) router.use('/', deleteChildRouter);
if (excusesRouter) router.use('/', excusesRouter);

router.get('/test', (req, res) => {
  res.json({
    message: 'Children router is working',
    timestamp: new Date().toISOString(),
  });
});

export default router;
