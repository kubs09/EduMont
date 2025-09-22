/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const { generateResetToken } = require('./services/token');
const { sendPasswordResetEmail } = require('./services/email');
const { validateForgotPasswordData } = require('./services/validation');

router.post('/forgot-password', async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, language } = req.body;

    // Validate input
    const validation = validateForgotPasswordData(email);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    const userResult = await client.query(
      'SELECT id, firstname, surname, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.json({ success: true });
    }

    const user = userResult.rows[0];
    const resetToken = generateResetToken();

    await client.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = NOW() + interval '1 hour' WHERE id = $2",
      [resetToken, user.id]
    );

    await sendPasswordResetEmail(user.email, resetToken, language);

    return res.json({ success: true });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process password reset request',
    });
  } finally {
    client.release();
  }
});

module.exports = router;
