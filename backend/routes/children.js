/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        age,
        parent_name,
        contact,
        notes
      FROM children 
      ORDER BY name ASC
    `);

    if (result.rows.length === 0) {
      return res.json([]);
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({
      error: 'Failed to fetch children',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

module.exports = router;
