/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authenticateToken = require('../../middleware/auth');
const { canEditChildpresentation } = require('./validation');

// Delete a presentation entry
router.delete('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const presentationResult = await client.query(
      'SELECT child_id FROM presentations WHERE id = $1',
      [id]
    );
    if (presentationResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'presentation not found' });
    }

    const childId = presentationResult.rows[0].child_id;

    // Check if user can edit this child's presentation
    const canEdit = await canEditChildpresentation(req.user.id, req.user.role, childId);
    if (!canEdit) {
      await client.query('ROLLBACK');
      return res
        .status(403)
        .json({ error: 'You do not have permission to delete this presentation entry' });
    }

    // Delete the presentation
    await client.query('DELETE FROM presentations WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'presentation entry deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting presentation:', err);
    res.status(500).json({ error: 'Failed to delete presentation entry' });
  } finally {
    client.release();
  }
});

module.exports = router;
