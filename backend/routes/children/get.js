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

module.exports = router;
