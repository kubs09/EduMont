/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

// Get all messages for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      WITH recipients AS (
        SELECT 
          m2.subject,
          m2.content,
          m2.created_at,
          m2.from_user_id,
          json_agg(json_build_object(
            'id', u.id,
            'firstname', u.firstname,
            'surname', u.surname,
            'email', u.email
          ) ORDER BY u.surname, u.firstname) as recipients
        FROM messages m2
        JOIN users u ON m2.to_user_id = u.id
        GROUP BY m2.subject, m2.content, m2.created_at, m2.from_user_id
      )
      SELECT DISTINCT ON (m.subject, m.content, m.created_at) m.*, 
        json_build_object(
          'firstname', f.firstname,
          'surname', f.surname,
          'email', f.email
        ) as from_user,
        json_build_object(
          'firstname', t.firstname,
          'surname', t.surname,
          'email', t.email
        ) as to_user,
        r.recipients
      FROM messages m
      JOIN users f ON m.from_user_id = f.id
      JOIN users t ON m.to_user_id = t.id
      LEFT JOIN recipients r ON 
        r.subject = m.subject 
        AND r.content = m.content 
        AND r.created_at = m.created_at
        AND r.from_user_id = m.from_user_id
      WHERE m.to_user_id = $1 AND NOT m.deleted_by_recipient
      OR m.from_user_id = $1 AND NOT m.deleted_by_sender
      ORDER BY m.subject, m.content, m.created_at DESC, m.id DESC
    `,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get a specific message by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      WITH recipients AS (
        SELECT 
          m2.subject,
          m2.content,
          m2.created_at,
          m2.from_user_id,
          json_agg(json_build_object(
            'id', u.id,
            'firstname', u.firstname,
            'surname', u.surname,
            'email', u.email
          ) ORDER BY u.surname, u.firstname) as recipients
        FROM messages m2
        JOIN users u ON m2.to_user_id = u.id
        WHERE m2.subject = (SELECT subject FROM messages WHERE id = $1)
          AND m2.content = (SELECT content FROM messages WHERE id = $1)
          AND m2.created_at = (SELECT created_at FROM messages WHERE id = $1)
          AND m2.from_user_id = (SELECT from_user_id FROM messages WHERE id = $1)
        GROUP BY m2.subject, m2.content, m2.created_at, m2.from_user_id
      )
      SELECT m.*, 
        json_build_object(
          'firstname', f.firstname,
          'surname', f.surname,
          'email', f.email
        ) as from_user,
        json_build_object(
          'firstname', t.firstname,
          'surname', t.surname,
          'email', t.email
        ) as to_user,
        r.recipients
      FROM messages m
      JOIN users f ON m.from_user_id = f.id
      JOIN users t ON m.to_user_id = t.id
      LEFT JOIN recipients r ON 
        r.subject = m.subject 
        AND r.content = m.content 
        AND r.created_at = m.created_at
        AND r.from_user_id = m.from_user_id
      WHERE m.id = $1 AND (m.to_user_id = $2 OR m.from_user_id = $2)
    `,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (result.rows[0].to_user_id === req.user.id && !result.rows[0].read_at) {
      await pool.query('UPDATE messages SET read_at = NOW() WHERE id = $1', [req.params.id]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

module.exports = router;
