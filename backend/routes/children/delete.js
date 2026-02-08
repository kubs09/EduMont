/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authenticateToken = require('../../middleware/auth');

router.delete('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    const child = await client.query('SELECT id FROM children WHERE id = $1', [id]);

    if (child.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    if (req.user.role === 'parent') {
      const parentLink = await client.query(
        'SELECT 1 FROM child_parents WHERE child_id = $1 AND parent_id = $2',
        [id, req.user.id]
      );
      if (parentLink.rows.length === 0) {
        return res.status(403).json({ error: 'Unauthorized to delete this child' });
      }
    }

    await client.query('BEGIN');

    await client.query('DELETE FROM class_children WHERE child_id = $1', [id]);
    await client.query('DELETE FROM children WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Child deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting child:', err);
    res.status(500).json({ error: 'Failed to delete child record' });
  } finally {
    client.release();
  }
});

router.delete('/:childId/classes/:classId', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { childId, classId } = req.params;

    const child = await client.query('SELECT id FROM children WHERE id = $1', [childId]);

    if (child.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    if (req.user.role === 'parent') {
      const parentLink = await client.query(
        'SELECT 1 FROM child_parents WHERE child_id = $1 AND parent_id = $2',
        [childId, req.user.id]
      );
      if (parentLink.rows.length === 0) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    await client.query('DELETE FROM class_children WHERE child_id = $1 AND class_id = $2', [
      childId,
      classId,
    ]);

    res.json({ message: 'Child removed from class successfully' });
  } catch (err) {
    console.error('Error removing child from class:', err);
    res.status(500).json({
      error: 'Failed to remove child from class',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  } finally {
    client.release();
  }
});

module.exports = router;
