/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

router.get('/:id/next-activities', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === 'teacher') {
      const teacherClassResult = await pool.query(
        'SELECT 1 FROM class_teachers WHERE class_id = $1 AND teacher_id = $2',
        [id, req.user.id]
      );
      if (teacherClassResult.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'parent') {
      const parentChildResult = await pool.query(
        `SELECT 1 FROM class_children cc
         JOIN children ch ON cc.child_id = ch.id
         WHERE cc.class_id = $1 AND EXISTS (
           SELECT 1 FROM child_parents cp WHERE cp.child_id = ch.id AND cp.parent_id = $2
         )`,
        [id, req.user.id]
      );
      if (parentChildResult.rows.length === 0) {
        return res.json([]);
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = `
      SELECT
        s.id,
        s.child_id,
        s.name AS activity,
        s.category,
        s.status,
        s.notes,
        s.created_at,
        ch.firstname,
        ch.surname
      FROM schedules s
      JOIN children ch ON s.child_id = ch.id
      JOIN class_children cc ON ch.id = cc.child_id
      WHERE cc.class_id = $1 
        AND s.status = 'in progress'
    `;

    const params = [id];

    if (req.user.role === 'parent') {
      query += ` AND EXISTS (
        SELECT 1 FROM child_parents cp WHERE cp.child_id = ch.id AND cp.parent_id = $2
      )`;
      params.push(req.user.id);
    }

    query += ` ORDER BY s.created_at ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching next activities:', err);
    res.status(500).json({ error: 'Failed to fetch next activities' });
  }
});

module.exports = router;
