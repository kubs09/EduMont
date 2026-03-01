/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authenticateToken = require('../../middleware/auth');
const {
  validatepresentation,
  canEditChildpresentation,
  normalizeCategoryOrdering,
} = require('./validation');

// Update a presentation entry
router.put('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { child_id, class_id, name, category, status, notes, display_order } = req.body;

    const validationErrors = validatepresentation(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    await client.query('BEGIN');

    const presentationResult = await client.query(
      'SELECT child_id, category FROM presentations WHERE id = $1',
      [id]
    );
    if (presentationResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'presentation not found' });
    }

    const previousChildId = presentationResult.rows[0].child_id;
    const previousCategory = presentationResult.rows[0].category;

    const canEdit = await canEditChildpresentation(req.user.id, req.user.role, child_id);
    if (!canEdit) {
      await client.query('ROLLBACK');
      return res
        .status(403)
        .json({ error: "You do not have permission to edit this child's presentation" });
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
      UPDATE presentations 
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
    console.error('Error updating presentation:', err);
    res.status(500).json({ error: 'Failed to update presentation entry' });
  } finally {
    client.release();
  }
});

module.exports = router;
