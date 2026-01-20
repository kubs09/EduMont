/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

// Confirm a child's class assignment
router.post('/:classId/children/:childId/confirm', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res
      .status(403)
      .json({ error: 'Only administrators and teachers can confirm class assignments' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE class_children SET confirmed = TRUE, status = $3 WHERE class_id = $1 AND child_id = $2',
      [req.params.classId, req.params.childId, 'accepted']
    );

    // Fetch updated class data
    const result = await client.query(
      `
      SELECT 
        c.*,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id', t.id,
            'firstname', t.firstname,
            'surname', t.surname
          )) FILTER (WHERE t.id IS NOT NULL),
          '[]'::jsonb
        ) as teachers,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id', ch.id,
            'firstname', ch.firstname,
            'surname', ch.surname,
            'date_of_birth', ch.date_of_birth,
            'parent_id', ch.parent_id,
            'parent_firstname', p.firstname,
            'parent_surname', p.surname,
            'parent_email', p.email,
            'parent_contact', p.phone,
            'confirmed', cc.confirmed,
            'status', COALESCE(cc.status, 'pending'),
            'age', EXTRACT(YEAR FROM age(CURRENT_DATE, ch.date_of_birth))::integer
          )) FILTER (WHERE ch.id IS NOT NULL),
          '[]'::jsonb
        ) as children
      FROM classes c
      LEFT JOIN class_teachers ct ON c.id = ct.class_id
      LEFT JOIN users t ON ct.teacher_id = t.id
      LEFT JOIN class_children cc ON c.id = cc.class_id
      LEFT JOIN children ch ON cc.child_id = ch.id
      LEFT JOIN users p ON ch.parent_id = p.id
      WHERE c.id = $1
      GROUP BY c.id`,
      [req.params.classId]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to confirm class assignment' });
  } finally {
    client.release();
  }
});

// Deny a child's class assignment
router.post('/:classId/children/:childId/deny', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res
      .status(403)
      .json({ error: 'Only administrators and teachers can deny class assignments' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE class_children SET confirmed = FALSE, status = $3 WHERE class_id = $1 AND child_id = $2',
      [req.params.classId, req.params.childId, 'denied']
    );

    // Fetch updated class data with all children and their confirmation status
    const result = await client.query(
      `
      SELECT 
        c.*,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id', t.id,
            'firstname', t.firstname,
            'surname', t.surname
          )) FILTER (WHERE t.id IS NOT NULL),
          '[]'::jsonb
        ) as teachers,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id', ch.id,
            'firstname', ch.firstname,
            'surname', ch.surname,
            'date_of_birth', ch.date_of_birth,
            'parent_id', ch.parent_id,
            'parent_firstname', p.firstname,
            'parent_surname', p.surname,
            'parent_email', p.email,
            'parent_contact', p.phone,
            'confirmed', COALESCE(cc.confirmed, false),
            'status', CASE 
              WHEN cc.status = 'denied' THEN 'denied'
              WHEN cc.confirmed THEN 'accepted'
              ELSE 'pending'
            END,
            'age', EXTRACT(YEAR FROM age(CURRENT_DATE, ch.date_of_birth))::integer
          )) FILTER (WHERE ch.id IS NOT NULL),
          '[]'::jsonb
        ) as children
      FROM classes c
      LEFT JOIN class_teachers ct ON c.id = ct.class_id
      LEFT JOIN users t ON ct.teacher_id = t.id
      LEFT JOIN class_children cc ON c.id = cc.class_id
      LEFT JOIN children ch ON cc.child_id = ch.id
      LEFT JOIN users p ON ch.parent_id = p.id
      WHERE c.id = $1
      GROUP BY c.id`,
      [req.params.classId]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to deny class assignment' });
  } finally {
    client.release();
  }
});

module.exports = router;
