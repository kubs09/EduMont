import { Router } from 'express';

const router = Router();

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

const getRouter = await loadOptionalRouter('./get.js');
const createRouter = await loadOptionalRouter('./create.js');
const updateRouter = await loadOptionalRouter('./update.js');
const deleteRouter = await loadOptionalRouter('./delete.js');
const categoriesGetRouter = await loadOptionalRouter('./categories-get.js');
const categoriesCreateRouter = await loadOptionalRouter('./categories-create.js');
const categoriesUpdateRouter = await loadOptionalRouter('./categories-update.js');
const categoriesDeleteRouter = await loadOptionalRouter('./categories-delete.js');
const statusRouter = await loadOptionalRouter('./status.js');
const nextPresentationsRouter = await loadOptionalRouter('./next-presentations.js');

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

export default router;
