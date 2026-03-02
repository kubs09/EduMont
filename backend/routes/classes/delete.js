import { Router } from 'express';
const router = Router();
import { connect } from '../../config/database.js';
import auth from '../../middleware/auth.js';

router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can delete classes' });
  }

  const client = await connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    await client.query('DELETE FROM class_teachers WHERE class_id = $1', [id]);
    await client.query('DELETE FROM class_children WHERE class_id = $1', [id]);
    await client.query('DELETE FROM classes WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to delete class' });
  } finally {
    client.release();
  }
});

export default router;
