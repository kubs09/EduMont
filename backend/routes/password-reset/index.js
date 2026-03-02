import { Router } from 'express';
import console from 'console';
const router = Router();

const initializeRouters = async () => {
  let forgotPasswordRouter, checkTokenRouter, resetPasswordRouter;

  try {
    const module = await import('./forgot-password.js');
    forgotPasswordRouter = module.default;
  } catch (error) {
    console.error('Error loading forgot-password router:', error);
    if (error?.code === 'ERR_MODULE_NOT_FOUND') {
      throw error;
    }
  }

  try {
    const module = await import('./check-token.js');
    checkTokenRouter = module.default;
  } catch (error) {
    console.error('Error loading check-token router:', error);
    if (error?.code === 'ERR_MODULE_NOT_FOUND') {
      throw error;
    }
  }

  try {
    const module = await import('./reset-password.js');
    resetPasswordRouter = module.default;
  } catch (error) {
    console.error('Error loading reset-password router:', error);
    if (error?.code === 'ERR_MODULE_NOT_FOUND') {
      throw error;
    }
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
