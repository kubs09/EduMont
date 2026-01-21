/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('@config/database');
const auth = require('@middleware/auth');

router.delete('/:id', auth, async (req, res) => {
  const userId = req.params.id;
  const client = await pool.connect();

  try {
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    await client.query('BEGIN');
    const userCheck = await client.query('SELECT id, role FROM users WHERE id = $1', [userId]);

    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    const userRole = userCheck.rows[0].role;

    await client.query('DELETE FROM class_teachers WHERE teacher_id = $1', [userId]);

    if (userRole === 'parent') {
      const childrenResult = await client.query('SELECT id FROM children WHERE parent_id = $1', [
        userId,
      ]);
      const childIds = childrenResult.rows.map((row) => row.id);

      if (childIds.length > 0) {
        await client.query('DELETE FROM schedules WHERE child_id = ANY($1)', [childIds]);

        await client.query('DELETE FROM class_children WHERE child_id = ANY($1)', [childIds]);
      }
      await client.query('DELETE FROM children WHERE parent_id = $1', [userId]);
    }

    await client.query('DELETE FROM messages WHERE from_user_id = $1 OR to_user_id = $1', [userId]);

    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  } finally {
    client.release();
  }
});

module.exports = router;
