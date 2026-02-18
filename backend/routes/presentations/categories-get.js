/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

// Get all category presentations
router.get('/categories', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = `
      SELECT 
        id,
        category,
        name,
        age_group,
        display_order,
        notes,
        created_at
      FROM category_presentations
      ORDER BY age_group ASC, category ASC, display_order ASC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching category presentations:', error);
    res.status(500).json({ error: 'Failed to fetch category presentations' });
  }
});

// Get presentations by category
router.get('/categories/category/:category', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { category } = req.params;

    const query = `
      SELECT 
        id,
        category,
        name,
        age_group,
        display_order,
        notes,
        created_at
      FROM category_presentations
      WHERE category = $1
      ORDER BY age_group ASC, display_order ASC
    `;

    const result = await pool.query(query, [category]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching presentations by category:', error);
    res.status(500).json({ error: 'Failed to fetch presentations' });
  }
});

// Get all unique categories
router.get('/categories/list/categories', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = `
      SELECT DISTINCT category
      FROM category_presentations
      ORDER BY category ASC
    `;

    const result = await pool.query(query);
    res.json(result.rows.map((row) => row.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
