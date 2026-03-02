import { Router } from 'express';
const router = Router();

const initializeRouters = async () => {
  let forgotPasswordRouter, checkTokenRouter, resetPasswordRouter;

  try {
    const module = await import('./forgot-password');
    forgotPasswordRouter = module.default;
  } catch (error) {
    forgotPasswordRouter = null;
  }

  try {
    const module = await import('./check-token');
    checkTokenRouter = module.default;
  } catch (error) {
    checkTokenRouter = null;
  }

  try {
    const module = await import('./reset-password');
    resetPasswordRouter = module.default;
  } catch (error) {
    resetPasswordRouter = null;
  }

  if (forgotPasswordRouter) router.use('/', forgotPasswordRouter);
  if (checkTokenRouter) router.use('/', checkTokenRouter);
  if (resetPasswordRouter) router.use('/', resetPasswordRouter);
};

initializeRouters();

router.get('/test', (req, res) => {
  res.json({
    message: 'Password reset router is working',
    timestamp: new Date().toISOString(),
  });
});

export default router;
