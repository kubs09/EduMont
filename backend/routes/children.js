/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT 
        c.id, 
        c.firstname,
        c.surname, 
        c.date_of_birth,
        c.contact,
        c.notes,
        u.firstname as parent_firstname,
        u.surname as parent_surname,
        u.email as parent_email
      FROM children c
      JOIN users u ON c.parent_id = u.id
    `;

    // If user is a parent, only show their children
    const params = [];
    if (req.user.role === 'parent') {
      query += ' WHERE c.parent_id = $1';
      params.push(req.user.id);
    }

    query += ' ORDER BY c.surname ASC';

    const result = await pool.query(query, params);

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

router.post('/', authenticateToken, async (req, res) => {
  if (!['admin', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Unauthorized to create children records' });
  }

  try {
    const { firstname, surname, date_of_birth, parent_id, contact, notes } = req.body;

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date_of_birth)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const result = await pool.query(
      `INSERT INTO children (firstname, surname, date_of_birth, parent_id, contact, notes)
       VALUES ($1, $2, $3::date, $4, $5, $6)
       RETURNING *`,
      [firstname, surname, date_of_birth, parent_id, contact, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Failed to create child record' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, surname, date_of_birth, parent_id, contact, notes } = req.body;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date_of_birth)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const child = await pool.query('SELECT parent_id FROM children WHERE id = $1', [id]);
    if (child.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    if (req.user.role === 'parent' && child.rows[0].parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to edit this child' });
    }

    const result = await pool.query(
      `UPDATE children 
       SET firstname = $1, surname = $2, date_of_birth = $3::date, parent_id = $4, contact = $5, notes = $6
       WHERE id = $7
       RETURNING *`,
      [firstname, surname, date_of_birth, parent_id, contact, notes, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Failed to update child record' });
  }
});

module.exports = router;
