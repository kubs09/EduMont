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
    const { child_id, class_id, name, category, status, notes } = req.body;

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

    const result = await client.query(
      `
      UPDATE schedules 
      SET child_id = $1, class_id = $2, name = $3, category = $4, status = $5, 
          notes = $6, updated_at = CURRENT_TIMESTAMP, updated_by = $7
      WHERE id = $8
      RETURNING *
    `,
      [child_id, class_id, name, category, status, notes, req.user.id, id]
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
