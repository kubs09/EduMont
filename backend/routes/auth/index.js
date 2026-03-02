import { Router } from 'express';
import loginRouter from './login.js';
import signupRouter from './signup.js';
import passwordResetRouter from './password-reset.js';

const router = Router();

if (loginRouter) router.use('/', loginRouter);
if (signupRouter) router.use('/', signupRouter);
if (passwordResetRouter) router.use('/', passwordResetRouter);

router.get('/auth-test', (req, res) => {
  res.json({
    message: 'Auth router is working',
    timestamp: new Date().toISOString(),
  });
});

export default router;
