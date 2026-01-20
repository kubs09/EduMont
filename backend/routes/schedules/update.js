/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authenticateToken = require('../../middleware/auth');
const { validateSchedule, canEditChildSchedule } = require('./validation');

// Update a schedule entry
router.put('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { child_id, class_id, date, start_time, duration_hours, activity, notes } = req.body;

    const validationErrors = validateSchedule(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    await client.query('BEGIN');

    const scheduleResult = await client.query('SELECT child_id FROM schedules WHERE id = $1', [id]);
    if (scheduleResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const canEdit = await canEditChildSchedule(req.user.id, req.user.role, child_id);
    if (!canEdit) {
      await client.query('ROLLBACK');
      return res
        .status(403)
        .json({ error: "You do not have permission to edit this child's schedule" });
    }

    const classChildResult = await client.query(
      'SELECT 1 FROM class_children WHERE child_id = $1 AND class_id = $2',
      [child_id, class_id]
    );

    if (classChildResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Child is not assigned to this class' });
    }

    const conflictResult = await client.query(
      `
      SELECT id FROM schedules 
      WHERE child_id = $1 AND date = $2 AND id != $5
      AND (
        (start_time <= $3 AND start_time + (duration_hours || ' hours')::interval > $3) OR
        (start_time < ($3 + ($4 || ' hours')::interval) AND start_time + (duration_hours || ' hours')::interval >= ($3 + ($4 || ' hours')::interval)) OR
        (start_time >= $3 AND start_time + (duration_hours || ' hours')::interval <= ($3 + ($4 || ' hours')::interval))
      )
    `,
      [child_id, date, start_time, duration_hours, id]
    );

    if (conflictResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Time conflict with existing schedule entry' });
    }

    const result = await client.query(
      `
      UPDATE schedules 
      SET child_id = $1, class_id = $2, date = $3, start_time = $4, duration_hours = $5, 
          activity = $6, notes = $7, updated_at = CURRENT_TIMESTAMP, updated_by = $8
      WHERE id = $9
      RETURNING *
    `,
      [child_id, class_id, date, start_time, duration_hours, activity, notes, req.user.id, id]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating schedule:', err);
    res.status(500).json({ error: 'Failed to update schedule entry' });
  } finally {
    client.release();
  }
});

module.exports = router;
