/*eslint-disable */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../config/database');
const { sendEmail } = require('../config/mail');
const getForgotPasswordEmail = require('../templates/forgotPasswordEmail');
const bcrypt = require('bcrypt');

// Generate reset token
const generateResetToken = () => crypto.randomBytes(32).toString('hex');

router.post('/forgot-password', async (req, res) => {
  const { email, language } = req.body;
  const client = await pool.connect();

  try {
    console.log('Processing password reset request for:', email, 'language:', language);

    // Check if user exists
    const userResult = await client.query(
      'SELECT id, firstname, surname FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log('User not found:', email);
      return res.status(200).json({ message: 'If email exists, reset instructions will be sent' });
    }

    const user = userResult.rows[0];
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token
    await client.query('UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3', [
      resetToken,
      resetTokenExpiry,
      user.id,
    ]);

    // Generate reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    console.log('Generated reset URL:', resetUrl);

    // Send email with better error handling
    try {
      const { subject, html } = getForgotPasswordEmail(resetUrl, language || 'en');
      console.log('Sending password reset email to:', email);

      await sendEmail({
        to: email,
        subject,
        html,
        from: process.env.SMTP_USER, // Explicitly set sender
      });

      console.log('Password reset email sent successfully');
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't expose email error to client
      return res.status(200).json({ message: 'If email exists, reset instructions will be sent' });
    }

    res.json({ message: 'If email exists, reset instructions will be sent' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  } finally {
    client.release();
  }
});

// Add this before the reset-password route
router.get('/check-token/:token', async (req, res) => {
  let { token } = req.params;
  const client = await pool.connect();

  try {
    // Clean token if it contains URL parts
    token = decodeURIComponent(token);
    if (token.includes('=')) {
      token = token.split('=').pop();
    }

    console.log('Checking token:', {
      originalToken: req.params.token,
      cleanedToken: token,
    });

    const result = await client.query(
      'SELECT id, reset_token, reset_token_expiry FROM users WHERE reset_token = $1',
      [token]
    );

    console.log('Token check:', {
      token,
      found: result.rows.length > 0,
      expiry: result.rows[0]?.reset_token_expiry,
      currentTime: new Date(),
    });

    res.json({
      valid: result.rows.length > 0,
      expired: result.rows[0]?.reset_token_expiry < new Date(),
    });
  } catch (error) {
    console.error('Token check error:', error);
    res.status(500).json({ error: 'Failed to check token' });
  } finally {
    client.release();
  }
});

// Update the reset-password route logging
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  const client = await pool.connect();

  console.log('Reset password attempt:', {
    tokenLength: token?.length,
    tokenValue: token,
    hasPassword: !!password,
    timestamp: new Date().toISOString(),
  });

  try {
    // Validate token format
    if (!token || token.length !== 64) {
      console.log('Invalid token format:', token);
      return res.status(400).json({ error: 'Invalid reset token format' });
    }

    await client.query('BEGIN');

    // First check if token exists and is valid
    const checkResult = await client.query(
      'SELECT id, reset_token, reset_token_expiry FROM users WHERE reset_token = $1',
      [token]
    );

    console.log('Token check result:', {
      found: checkResult.rows.length > 0,
      userId: checkResult.rows[0]?.id,
      expiry: checkResult.rows[0]?.reset_token_expiry,
    });

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

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Update password and clear token in a single query
    const updateResult = await client.query(
      `UPDATE users 
       SET password = $1, 
           reset_token = NULL, 
           reset_token_expiry = NULL 
       WHERE id = $2 AND reset_token = $3
       RETURNING id`,
      [hashedPassword, userId, token]
    );

    console.log('Password update result:', {
      updated: updateResult.rowCount > 0,
      userId: updateResult.rows[0]?.id,
    });

    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Failed to update password' });
    }

    await client.query('COMMIT');
    console.log('Password reset successful for user:', userId);
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  } finally {
    client.release();
  }
});

// Add this route for testing (remove in production)
router.post('/test-email', async (req, res) => {
  try {
    await sendEmail({
      to: req.body.email,
      subject: 'Test Email',
      html: '<p>This is a test email</p>',
    });
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
