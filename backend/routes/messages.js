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
        ) as to_user
      FROM messages m
      JOIN users f ON m.from_user_id = f.id
      JOIN users t ON m.to_user_id = t.id
      WHERE m.to_user_id = $1 AND NOT m.deleted_by_recipient
      OR m.from_user_id = $1 AND NOT m.deleted_by_sender
      ORDER BY m.created_at DESC
    `,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `
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
        ) as to_user
      FROM messages m
      JOIN users f ON m.from_user_id = f.id
      JOIN users t ON m.to_user_id = t.id
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
  const { to_user_id, subject, content } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO messages (from_user_id, to_user_id, subject, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, to_user_id, subject, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
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
