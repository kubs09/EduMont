/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('@config/database');
const auth = require('@middleware/auth');
const { validateUserProfile } = require('./services/validation');
const { hashPassword, comparePassword } = require('./services/password');

router.put('/:id', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (parseInt(id) !== userId) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const { firstname, surname, email, phone } = req.body;

    const validation = validateUserProfile({ firstname, surname, email, phone });
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    const result = await client.query(
      'UPDATE users SET firstname = $1, surname = $2, email = $3, phone = $4 WHERE id = $5 RETURNING id, firstname, surname, email, phone, role',
      [firstname, surname, email.toLowerCase(), phone || null, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    if (error.constraint === 'users_email_key') {
      return res.status(400).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  } finally {
    client.release();
  }
});

router.put('/:id/password', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (parseInt(id) !== userId) {
      return res.status(403).json({ error: 'You can only change your own password' });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await comparePassword(currentPassword, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await hashPassword(newPassword);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

router.put('/:id/notifications', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { messageNotifications } = req.body;
    const userId = parseInt(req.params.id);

    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to update other users settings' });
    }

    const result = await client.query(
      'UPDATE users SET message_notifications = $1 WHERE id = $2 RETURNING message_notifications',
      [messageNotifications, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ messageNotifications: result.rows[0].message_notifications });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  } finally {
    client.release();
  }
});

module.exports = router;
