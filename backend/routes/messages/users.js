import { Router } from 'express';
const router = Router();
import auth from '#backend/middleware/auth.js';
import { getAllowedRecipients } from './helpers.js';

router.get('/users', auth, async (req, res) => {
  try {
    const result = await getAllowedRecipients(req.user.id, req.user.role);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

export default router;
