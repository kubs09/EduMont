/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authenticateToken = require('../../middleware/auth');
const { validateSchedule, canEditChildSchedule } = require('./validation');

// Create a new schedule entry
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { child_id, class_id, name, category, status, notes } = req.body;

    const validationErrors = validateSchedule(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const canEdit = await canEditChildSchedule(req.user.id, req.user.role, child_id);
    if (!canEdit) {
      return res
        .status(403)
        .json({ error: "You do not have permission to edit this child's schedule" });
    }

    await client.query('BEGIN');

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
      INSERT INTO schedules (child_id, class_id, name, category, status, notes, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      RETURNING *
    `,
      [child_id, class_id, name, category, status || 'not started', notes, req.user.id]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating schedule:', err);
    res.status(500).json({ error: 'Failed to create schedule entry' });
  } finally {
    client.release();
  }
});

module.exports = router;
