/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const { sendEmail } = require('../../config/mail');
const getForgotPasswordEmail = require('../../templates/forgotPasswordEmail');
const { generateResetToken } = require('./helpers');

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

// Test email endpoint
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
