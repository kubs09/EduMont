/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const { comparePassword } = require('./services/password');
const { generateJwtToken } = require('./services/token');
const { validateLoginData } = require('./services/validation');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const validation = validateLoginData(email, password);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    const result = await pool.query(
      'SELECT id, email, password as hash, firstname, surname, role, message_notifications, phone FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    const validPassword = await comparePassword(password, user.hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateJwtToken(user);

    res.json({
      token,
      id: user.id,
      firstname: user.firstname,
      surname: user.surname,
      role: user.role,
      email: user.email,
      messageNotifications: user.message_notifications,
      phone: user.phone,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
