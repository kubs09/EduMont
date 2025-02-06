/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

// Move /users route before /:id to avoid route conflicts
router.get('/users', auth, async (req, res) => {
  try {
    console.log('Fetching users for messages, current user:', req.user.id);
    const result = await pool.query(
      `SELECT id, firstname, surname, email, role 
       FROM users 
       WHERE id != $1
       ORDER BY role, surname, firstname`,
      [req.user.id]
    );
    console.log(`Found ${result.rows.length} users`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in /messages/users:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

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
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

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

    // Mark message as read if recipient is viewing it
    if (result.rows[0].to_user_id === req.user.id && !result.rows[0].read_at) {
      await pool.query('UPDATE messages SET read_at = NOW() WHERE id = $1', [req.params.id]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

router.post('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { to_user_ids, subject, content } = req.body;
    const from_user_id = req.user.id;

    // Create all messages in a single query
    const values = to_user_ids
      .map((to_user_id) => `(${from_user_id}, ${to_user_id}, $1, $2)`)
      .join(', ');

    const query = `
      INSERT INTO messages (from_user_id, to_user_id, subject, content)
      VALUES ${values}
      RETURNING *;
    `;

    const result = await client.query(query, [subject, content]);
    await client.query('COMMIT');

    // Return only the first message for confirmation
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to send message' });
  } finally {
    client.release();
  }
});

router.delete('/:id', auth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const message = await client.query(
      'SELECT * FROM messages WHERE id = $1 AND (from_user_id = $2 OR to_user_id = $2)',
      [req.params.id, req.user.id]
    );

    if (message.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Message not found' });
    }

    const column =
      message.rows[0].from_user_id === req.user.id ? 'deleted_by_sender' : 'deleted_by_recipient';
    await client.query(`UPDATE messages SET ${column} = true WHERE id = $1`, [req.params.id]);

    await client.query('COMMIT');
    res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to delete message' });
  } finally {
    client.release();
  }
});

module.exports = router;
