/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

// Create a new category presentation
router.post('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { category, name, age_group, display_order, notes } = req.body;

    // Validate required fields
    if (!category || !name || !age_group || display_order === undefined) {
      return res
        .status(400)
        .json({ error: 'Missing required fields: category, name, age_group, display_order' });
    }

    // Validate category and name are strings
    if (typeof category !== 'string' || typeof name !== 'string') {
      return res.status(400).json({ error: 'Category and name must be strings' });
    }

    // Validate display_order is a number
    if (typeof display_order !== 'number' || display_order < 1) {
      return res.status(400).json({ error: 'Display order must be a positive number' });
    }

    await client.query('BEGIN');

    // Shift down existing presentations at and after the display_order
    // Step 1: Convert to temporary negative values to avoid constraint conflicts
    const tempShiftQuery = `
      UPDATE category_presentations
      SET display_order = -(display_order + 1)
      WHERE category = $1 AND age_group = $2 AND display_order >= $3
    `;
    await client.query(tempShiftQuery, [category, age_group, display_order]);

    // Step 2: Convert negative values back to positive
    const finalShiftQuery = `
      UPDATE category_presentations
      SET display_order = -display_order
      WHERE category = $1 AND age_group = $2 AND display_order < 0
    `;
    await client.query(finalShiftQuery, [category, age_group]);

    // Insert the new presentation
    const insertQuery = `
      INSERT INTO category_presentations (category, name, age_group, display_order, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, category, name, age_group, display_order, notes, created_at
    `;

    const result = await client.query(insertQuery, [
      category,
      name,
      age_group,
      display_order,
      notes || null,
    ]);

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error creating category presentation:', error);
    res.status(500).json({ error: 'Failed to create category presentation' });
  } finally {
    client.release();
  }
});

module.exports = router;
