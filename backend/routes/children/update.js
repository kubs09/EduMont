/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authenticateToken = require('../../middleware/auth');
const { validateChild } = require('./validation');

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, surname, date_of_birth, parent_id, notes } = req.body;

    // Validate input
    const validationErrors = validateChild(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

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
       SET firstname = $1, surname = $2, date_of_birth = $3::date, parent_id = $4, notes = $5
       WHERE id = $6
       RETURNING *`,
      [firstname, surname, date_of_birth, parent_id, notes, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update child record' });
  }
});

module.exports = router;
