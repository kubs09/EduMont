/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authenticateToken = require('../../middleware/auth');
const {
  validateSchedule,
  canEditChildSchedule,
  normalizeCategoryOrdering,
} = require('./validation');

// Update a schedule entry
router.put('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { child_id, class_id, name, category, status, notes, display_order } = req.body;

    const validationErrors = validateSchedule(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    await client.query('BEGIN');

    const scheduleResult = await client.query(
      'SELECT child_id, category FROM schedules WHERE id = $1',
      [id]
    );
    if (scheduleResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const previousChildId = scheduleResult.rows[0].child_id;
    const previousCategory = scheduleResult.rows[0].category;

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
      SET child_id = $1, class_id = $2, name = $3, category = $4, display_order = $5, status = $6, 
          notes = $7, updated_at = CURRENT_TIMESTAMP, updated_by = $8
      WHERE id = $9
      RETURNING *
    `,
      [child_id, class_id, name, category, display_order || 0, status, notes, req.user.id, id]
    );

    await normalizeCategoryOrdering(client, child_id, category);
    if (previousChildId !== child_id || previousCategory !== category) {
      await normalizeCategoryOrdering(client, previousChildId, previousCategory);
    }

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
