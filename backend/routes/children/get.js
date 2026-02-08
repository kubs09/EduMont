/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authenticateToken = require('../../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT 
        c.id, 
        c.firstname,
        c.surname, 
        c.date_of_birth,
        c.notes,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', u.id,
              'firstname', u.firstname,
              'surname', u.surname,
              'email', u.email,
              'phone', u.phone
            )
            ORDER BY u.surname, u.firstname
          )
          FROM child_parents cp
          JOIN users u ON cp.parent_id = u.id
          WHERE cp.child_id = c.id),
          '[]'
        ) as parents,
        cl.id as class_id,
        cl.name as class_name
      FROM children c
      LEFT JOIN class_children cc ON c.id = cc.child_id
      LEFT JOIN classes cl ON cc.class_id = cl.id
    `;

    const params = [];
    if (req.user.role === 'parent') {
      query +=
        ' WHERE EXISTS (SELECT 1 FROM child_parents cp WHERE cp.child_id = c.id AND cp.parent_id = $1)';
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

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        c.id, 
        c.firstname,
        c.surname, 
        c.date_of_birth,
        c.notes,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', u.id,
              'firstname', u.firstname,
              'surname', u.surname,
              'email', u.email,
              'phone', u.phone
            )
            ORDER BY u.surname, u.firstname
          )
          FROM child_parents cp
          JOIN users u ON cp.parent_id = u.id
          WHERE cp.child_id = c.id),
          '[]'
        ) as parents,
        cl.id as class_id,
        cl.name as class_name
      FROM children c
      LEFT JOIN class_children cc ON c.id = cc.child_id
      LEFT JOIN classes cl ON cc.class_id = cl.id
      WHERE c.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const child = result.rows[0];

    // Check if user has access to this child
    if (req.user.role === 'parent' && !child.parents.some((parent) => parent.id === req.user.id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(child);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch child',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

router.get('/:id/classes', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        cl.id,
        cl.name,
        cl.description,
        cc.status,
        u.firstname as teacher_firstname,
        u.surname as teacher_surname
      FROM class_children cc
      JOIN classes cl ON cc.class_id = cl.id
      LEFT JOIN class_teachers ct ON cl.id = ct.class_id
      LEFT JOIN users u ON ct.teacher_id = u.id
      WHERE cc.child_id = $1
      ORDER BY cl.name ASC
    `;

    const result = await pool.query(query, [id]);
    res.json(result.rows || []);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch child classes',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

router.get('/:id/schedules', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        s.id,
        s.name,
        s.category,
        s.status,
        s.notes,
        s.child_id,
        s.class_id
      FROM schedules s
      WHERE s.child_id = $1
      ORDER BY s.created_at DESC
    `;

    const result = await pool.query(query, [id]);
    res.json(result.rows || []);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch child schedules',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

module.exports = router;
