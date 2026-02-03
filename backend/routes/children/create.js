/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authenticateToken = require('../../middleware/auth');
const { validateChild } = require('./validation');

router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { firstname, surname, date_of_birth, parent_id, notes } = req.body;

    // Validate input
    const validationErrors = validateChild(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // For parents, force parent_id to be their own ID
    const actualParentId = req.user.role === 'parent' ? req.user.id : parent_id;

    // Verify if admin/teacher or parent is creating for themselves
    if (req.user.role === 'parent' && actualParentId !== req.user.id) {
      return res.status(403).json({ error: 'Parents can only add their own children' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date_of_birth)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    await client.query('BEGIN');

    // Insert the child
    const childResult = await client.query(
      `INSERT INTO children (firstname, surname, date_of_birth, parent_id, notes)
       VALUES ($1, $2, $3::date, $4, $5)
       RETURNING *`,
      [firstname, surname, date_of_birth, actualParentId, notes]
    );

    // Calculate child's age
    const childAge = Math.floor(
      (new Date() - new Date(date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)
    );

    // Find suitable class for the child's age
    const classResult = await client.query(
      'SELECT id FROM classes WHERE $1 BETWEEN min_age AND max_age LIMIT 1',
      [childAge]
    );

    if (classResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'noSuitableClass',
        details: null,
      });
    }

    // Assign child to the class
    await client.query('INSERT INTO class_children (class_id, child_id) VALUES ($1, $2)', [
      classResult.rows[0].id,
      childResult.rows[0].id,
    ]);

    await client.query('COMMIT');
    res.status(201).json(childResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating child:', err);
    res.status(500).json({ error: 'Failed to create child record' });
  } finally {
    client.release();
  }
});

module.exports = router;
