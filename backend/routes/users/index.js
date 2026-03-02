import { Router } from 'express';
const router = Router();

import listRouter from './list.js';
import profileRouter from './profile.js';
import invitationsRouter from './invitations.js';
import deleteRouter from './delete.js';

router.use('/', listRouter);
router.use('/', profileRouter);
router.use('/', invitationsRouter);
router.use('/', deleteRouter);

export default router;
