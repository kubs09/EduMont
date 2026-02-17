/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

// Create a new category presentation
router.post('/', auth, async (req, res) => {
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
    if (typeof display_order !== 'number' || display_order < 0) {
      return res.status(400).json({ error: 'Display order must be a non-negative number' });
    }

    const query = `
      INSERT INTO category_presentations (category, name, age_group, display_order, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, category, name, age_group, display_order, notes, created_at
    `;

    const result = await pool.query(query, [
      category,
      name,
      age_group,
      display_order,
      notes || null,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(400).json({
        error: 'A presentation with this category and display order already exists',
      });
    }
    console.error('Error creating category presentation:', error);
    res.status(500).json({ error: 'Failed to create category presentation' });
  }
});

module.exports = router;
