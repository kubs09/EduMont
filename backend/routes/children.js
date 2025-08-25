/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');

const validateChild = (data) => {
  const errors = [];

  if (!data.firstname || data.firstname.length < 2 || data.firstname.length > 100) {
    errors.push('First name must be between 2 and 100 characters');
  }

  if (!data.surname || data.surname.length < 2 || data.surname.length > 100) {
    errors.push('Surname must be between 2 and 100 characters');
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data.date_of_birth)) {
    errors.push('Invalid date format. Use YYYY-MM-DD');
  } else {
    const birthDate = new Date(data.date_of_birth);
    const now = new Date();
    const age = now.getFullYear() - birthDate.getFullYear();
    if (age < 0 || age > 18) {
      errors.push('Child age must be between 0 and 18 years');
    }
  }

  if (data.notes && data.notes.length > 1000) {
    errors.push('Notes must not exceed 1000 characters');
  }

  return errors;
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT 
        c.id, 
        c.firstname,
        c.surname, 
        c.date_of_birth,
        c.notes,
        u.firstname as parent_firstname,
        u.surname as parent_surname,
        u.email as parent_email,
        u.phone as parent_contact,
        COALESCE(cc.status, 'pending') as status,
        COALESCE(cc.confirmed, false) as confirmed,
        cl.id as class_id,
        cl.name as class_name
      FROM children c
      JOIN users u ON c.parent_id = u.id
      LEFT JOIN class_children cc ON c.id = cc.child_id
      LEFT JOIN classes cl ON cc.class_id = cl.id
    `;

    const params = [];
    if (req.user.role === 'parent') {
      query += ' WHERE c.parent_id = $1';
      params.push(req.user.id);
    } else if (req.user.role === 'teacher') {
      // Teachers can only see children from their assigned classes
      query += ` WHERE cl.id IN (
        SELECT ct.class_id 
        FROM class_teachers ct 
        WHERE ct.teacher_id = $1
      )`;
      params.push(req.user.id);
    }

    query += ' ORDER BY c.surname ASC';

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.json([]);
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch children',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

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
        details: null, // Remove the hard-coded English message
      });
    }

    // Assign child to the class
    await client.query(
      'INSERT INTO class_children (class_id, child_id, confirmed) VALUES ($1, $2, false)',
      [classResult.rows[0].id, childResult.rows[0].id]
    );

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

router.delete('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    // Check if child exists and get parent_id
    const child = await client.query('SELECT parent_id FROM children WHERE id = $1', [id]);

    if (child.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Verify ownership or admin/teacher role
    if (req.user.role === 'parent' && child.rows[0].parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this child' });
    }

    // Start transaction
    await client.query('BEGIN');

    // First delete from class_children
    await client.query('DELETE FROM class_children WHERE child_id = $1', [id]);

    // Then delete the child
    await client.query('DELETE FROM children WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Child deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting child:', err);
    res.status(500).json({ error: 'Failed to delete child record' });
  } finally {
    client.release();
  }
});

module.exports = router;
