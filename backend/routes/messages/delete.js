import { Router } from 'express';
const router = Router();
import { connect } from '../../config/database.js';
import auth from '../../middleware/auth.js';

router.delete('/:id', auth, async (req, res) => {
  const client = await connect();

  try {
    await client.query('BEGIN');

    const message = await client.query(
      'SELECT * FROM messages WHERE id = $1 AND (from_user_id = $2 OR to_user_id = $2)',
      [req.params.id, req.user.id]
    );

    if (message.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Message not found' });
    }

    const column =
      message.rows[0].from_user_id === req.user.id ? 'deleted_by_sender' : 'deleted_by_recipient';
    await client.query(`UPDATE messages SET ${column} = true WHERE id = $1`, [req.params.id]);

    await client.query('COMMIT');
    res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to delete message' });
  } finally {
    client.release();
  }
});

export default router;
