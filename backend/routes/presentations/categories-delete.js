/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

// Delete a category presentation
router.delete('/categories/:id', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid presentation ID' });
    }

    // Check if presentation exists and get its details
    const existsQuery =
      'SELECT id, category, age_group, display_order FROM category_presentations WHERE id = $1';
    const existsResult = await client.query(existsQuery, [id]);
    if (existsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category presentation not found' });
    }

    const { category, age_group, display_order } = existsResult.rows[0];

    await client.query('BEGIN');

    const deleteQuery = 'DELETE FROM category_presentations WHERE id = $1';
    await client.query(deleteQuery, [id]);

    const tempUpdateQuery = `
      UPDATE category_presentations
      SET display_order = -(display_order - 1)
      WHERE category = $1 AND age_group = $2 AND display_order > $3
    `;
    await client.query(tempUpdateQuery, [category, age_group, display_order]);

    const finalUpdateQuery = `
      UPDATE category_presentations
      SET display_order = -display_order
      WHERE category = $1 AND age_group = $2 AND display_order < 0
    `;
    await client.query(finalUpdateQuery, [category, age_group]);

    await client.query('COMMIT');
    res.json({ message: 'Category presentation deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error deleting category presentation:', error);
    res.status(500).json({ error: 'Failed to delete category presentation' });
  } finally {
    client.release();
  }
});

module.exports = router;
