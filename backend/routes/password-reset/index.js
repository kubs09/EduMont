import { Router } from 'express';
const router = Router();

const initializeRouters = async () => {
  let forgotPasswordRouter, checkTokenRouter, resetPasswordRouter;

  try {
    const module = await import('./forgot-password.js');
    forgotPasswordRouter = module.default;
  } catch (error) {
    forgotPasswordRouter = null;
  }

  try {
    const module = await import('./check-token.js');
    checkTokenRouter = module.default;
  } catch (error) {
    checkTokenRouter = null;
  }

  try {
    const module = await import('./reset-password.js');
    resetPasswordRouter = module.default;
  } catch (error) {
    resetPasswordRouter = null;
  }

  if (forgotPasswordRouter) router.use('/', forgotPasswordRouter);
  if (checkTokenRouter) router.use('/', checkTokenRouter);
  if (resetPasswordRouter) router.use('/', resetPasswordRouter);
};

await initializeRouters();

router.get('/test', (req, res) => {
  res.json({
    message: 'Password reset router is working',
    timestamp: new Date().toISOString(),
  });
});

export default router;
