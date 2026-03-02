import { Router } from 'express';
import requestRoute from './request.js';
import updateRoute from './update.js';

const router = Router();

router.use('/', requestRoute);
router.use('/', updateRoute);

export default router;
