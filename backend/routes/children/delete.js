/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authenticateToken = require('../../middleware/auth');

router.delete('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    // Check if child exists and get parent_id
    const child = await client.query('SELECT parent_id FROM children WHERE id = $1', [id]);

    if (child.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Verify ownership or admin/teacher role
    if (req.user.role === 'parent' && child.rows[0].parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this child' });
    }

    // Start transaction
    await client.query('BEGIN');

    // First delete from class_children
    await client.query('DELETE FROM class_children WHERE child_id = $1', [id]);

    // Then delete the child
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

module.exports = router;
