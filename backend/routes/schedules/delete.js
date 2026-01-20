/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authenticateToken = require('../../middleware/auth');
const { canEditChildSchedule } = require('./validation');

// Delete a schedule entry
router.delete('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const scheduleResult = await client.query('SELECT child_id FROM schedules WHERE id = $1', [id]);
    if (scheduleResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const childId = scheduleResult.rows[0].child_id;

    // Check if user can edit this child's schedule
    const canEdit = await canEditChildSchedule(req.user.id, req.user.role, childId);
    if (!canEdit) {
      await client.query('ROLLBACK');
      return res
        .status(403)
        .json({ error: 'You do not have permission to delete this schedule entry' });
    }

    // Delete the schedule
    await client.query('DELETE FROM schedules WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Schedule entry deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting schedule:', err);
    res.status(500).json({ error: 'Failed to delete schedule entry' });
  } finally {
    client.release();
  }
});

module.exports = router;
