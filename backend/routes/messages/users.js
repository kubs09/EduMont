import { Router } from 'express';
const router = Router();
import { connect } from '../../config/database.js';
import auth from '../../middleware/auth.js';
import { getAllowedRecipients } from './helpers.js';

router.get('/users', auth, async (req, res) => {
  let client;
  try {
    client = await connect();
    const result = await getAllowedRecipients(req.user.id, req.user.role, client);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  } finally {
    client?.release();
  }
});

export default router;
