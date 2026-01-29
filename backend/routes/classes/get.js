/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

router.get('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    let query = '';
    const params = [];

    if (req.user.role === 'admin' || req.user.role === 'teacher') {
      query = `
        SELECT 
          c.id,
          c.name,
          c.description,
          c.min_age,
          c.max_age,
          COALESCE(
            (SELECT json_agg(teacher)
            FROM (
              SELECT u.id, u.firstname, u.surname
              FROM class_teachers ct
              JOIN users u ON ct.teacher_id = u.id
              WHERE ct.class_id = c.id
            ) teacher),
            '[]'
          ) as teachers,
          COALESCE(
            (SELECT json_agg(child)
            FROM (
              SELECT 
                ch.id,
                ch.firstname,
                ch.surname,
                ch.date_of_birth,
                p.firstname as parent_firstname,
                p.surname as parent_surname,
                p.email as parent_email,
                concat(p.firstname, ' ', p.surname) as parent,
                p.phone as parent_contact,
                ch.parent_id,
                cc.confirmed,
                cc.status,
                EXTRACT(YEAR FROM age(CURRENT_DATE, ch.date_of_birth))::integer as age
              FROM class_children cc
              JOIN children ch ON cc.child_id = ch.id
              JOIN users p ON ch.parent_id = p.id
              WHERE cc.class_id = c.id
            ) child),
            '[]'
          ) as children
        FROM classes c`;
      if (req.user.role === 'teacher') {
        query += ` WHERE EXISTS (
          SELECT 1 FROM class_teachers ct 
          WHERE ct.class_id = c.id AND ct.teacher_id = $1
        )`;
        params.push(req.user.id);
      }
      query += ' ORDER BY c.name';
    } else if (req.user.role === 'parent') {
      query = `
        SELECT 
          c.id,
          c.name,
          c.description,
          c.min_age,
          c.max_age,
          COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', u.id,
                'firstname', u.firstname,
                'surname', u.surname
              )
            )
            FROM class_teachers ct
            JOIN users u ON ct.teacher_id = u.id
            WHERE ct.class_id = c.id),
            '[]'
          ) as teachers,
          COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', ch.id,
                'firstname', ch.firstname,
                'surname', ch.surname,
                'status', cc.status,
                'confirmed', cc.confirmed
              )
            )
            FROM class_children cc
            JOIN children ch ON cc.child_id = ch.id
            WHERE cc.class_id = c.id AND ch.parent_id = $1),
            '[]'
          ) as children
        FROM classes c
        WHERE EXISTS (
          SELECT 1 FROM class_children cc
          JOIN children ch ON cc.child_id = ch.id
          WHERE cc.class_id = c.id AND ch.parent_id = $1
        )
        ORDER BY c.name`;
      params.push(req.user.id);
    }
    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch classes',
      details: error.message,
    });
  } finally {
    client.release();
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // For parents, check if they have a child in this class
    if (req.user.role === 'parent') {
      const parentChildCheck = await pool.query(
        `SELECT 1 FROM class_children cc
         JOIN children ch ON cc.child_id = ch.id
         WHERE cc.class_id = $1 AND ch.parent_id = $2`,
        [id, req.user.id]
      );
      if (parentChildCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    let query = `
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
      WHERE c.id = $1`;

    const params = [id];

    if (req.user.role === 'parent') {
      query += ` AND (ch.parent_id = $2 OR ch.id IS NULL)`;
      params.push(req.user.id);
    }

    query += ` GROUP BY c.id, c.name, c.description, c.min_age, c.max_age`;

    const classDetails = await pool.query(query, params);
    if (classDetails.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json(classDetails.rows[0]);
  } catch (error) {
    console.error('Error fetching class details:', error);
    res.status(500).json({ error: 'Failed to fetch class details' });
  }
});

module.exports = router;
