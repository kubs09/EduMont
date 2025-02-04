/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');
const bcrypt = require('bcrypt');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, firstname, surname, email, role FROM users ORDER BY surname ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Get the authenticated user's ID

    // Check if user is trying to update their own profile
    if (parseInt(id) !== userId) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const { firstname, surname, email } = req.body;

    const result = await pool.query(
      'UPDATE users SET firstname = $1, surname = $2, email = $3 WHERE id = $4 RETURNING id, firstname, surname, email, role',
      [firstname, surname, email, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
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

    // Get current user's password hash
    const user = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
