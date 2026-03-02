import { Router } from 'express';
const router = Router();
import { connect } from '#backend/config/database.js';
import auth from '#backend/middleware/auth.js';

router.delete('/:id', auth, async (req, res) => {
  let client;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can delete classes' });
  }

  try {
    client = await connect();
    await client.query('BEGIN');
    const { id } = req.params;

    await client.query('DELETE FROM class_teachers WHERE class_id = $1', [id]);
    await client.query('DELETE FROM class_children WHERE class_id = $1', [id]);
    await client.query('DELETE FROM classes WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    res.status(500).json({ error: 'Failed to delete class' });
  } finally {
    client?.release();
  }
});

export default router;
