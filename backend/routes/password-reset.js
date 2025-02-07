/*eslint-disable */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../config/database');
const { sendEmail } = require('../config/mail');
const getForgotPasswordEmail = require('../templates/forgotPasswordEmail');
const bcrypt = require('bcrypt');

const generateResetToken = () => crypto.randomBytes(32).toString('hex');

router.post('/forgot-password', async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, language } = req.body;

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
      `UPDATE users 
       SET reset_token = $1, 
           reset_token_expiry = NOW() + INTERVAL '1 hour' 
       WHERE id = $2`,
      [resetToken, user.id]
    );

    // Build reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Generate email content
    const emailData = getForgotPasswordEmail(resetUrl, language || 'en');

    try {
      await sendEmail({
        to: user.email,
        subject: emailData.subject,
        html: emailData.html,
        from: `EduMont <${process.env.SMTP_FROM}>`,
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      throw emailError;
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ success: false, error: 'Failed to process request' });
  } finally {
    client.release();
  }
});

router.get('/check-token/:token', async (req, res) => {
  let { token } = req.params;
  const client = await pool.connect();

  try {
    token = decodeURIComponent(token);
    if (token.includes('=')) {
      token = token.split('=').pop();
    }

    const result = await client.query(
      'SELECT id, reset_token, reset_token_expiry FROM users WHERE reset_token = $1',
      [token]
    );

    res.json({
      valid: result.rows.length > 0,
      expired: result.rows[0]?.reset_token_expiry < new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check token' });
  } finally {
    client.release();
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  const client = await pool.connect();

  try {
    if (!token || token.length !== 64) {
      return res.status(400).json({ error: 'Invalid reset token format' });
    }

    await client.query('BEGIN');

    const checkResult = await client.query(
      'SELECT id, reset_token, reset_token_expiry FROM users WHERE reset_token = $1',
      [token]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const userId = checkResult.rows[0].id;
    const tokenExpiry = checkResult.rows[0].reset_token_expiry;

    if (tokenExpiry < new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updateResult = await client.query(
      `UPDATE users 
       SET password = $1, 
           reset_token = NULL, 
           reset_token_expiry = NULL 
       WHERE id = $2 AND reset_token = $3
       RETURNING id`,
      [hashedPassword, userId, token]
    );

    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Failed to update password' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to reset password' });
  } finally {
    client.release();
  }
});

router.post('/test-email', async (req, res) => {
  try {
    await sendEmail({
      to: req.body.email,
      subject: 'Test Email',
      html: '<p>This is a test email</p>',
    });
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
