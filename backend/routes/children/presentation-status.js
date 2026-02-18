/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authenticateToken = require('../../middleware/auth');
const {
  STATUS_VALUES,
  canEditChildSchedule,
  normalizeCategoryOrdering,
} = require('../schedules/validation');

router.put('/:childId/presentations/:scheduleId/status', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const childId = Number(req.params.childId);
    const scheduleId = Number(req.params.scheduleId);
    const { status, notes } = req.body || {};

    if (!Number.isInteger(childId) || !Number.isInteger(scheduleId)) {
      return res.status(400).json({ error: 'Invalid child or schedule ID' });
    }

    if (!status || !STATUS_VALUES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    if (notes && typeof notes === 'string' && notes.length > 1000) {
      return res.status(400).json({ error: 'Notes must not exceed 1000 characters' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const canEdit = await canEditChildSchedule(req.user.id, req.user.role, childId);
    if (!canEdit) {
      return res
        .status(403)
        .json({ error: "You do not have permission to edit this child's schedule" });
    }

    const scheduleResult = await client.query(
      'SELECT id, category FROM schedules WHERE id = $1 AND child_id = $2',
      [scheduleId, childId]
    );

    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found for this child' });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `
      UPDATE schedules
      SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP, updated_by = $3
      WHERE id = $4
      RETURNING *
    `,
      [status, typeof notes === 'string' ? notes : null, req.user.id, scheduleId]
    );

    await normalizeCategoryOrdering(client, childId, scheduleResult.rows[0].category);

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating presentation status:', error);
    res.status(500).json({ error: 'Failed to update presentation status' });
  } finally {
    client.release();
  }
});

module.exports = router;
