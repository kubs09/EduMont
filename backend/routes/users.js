/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const emailTexts = require('../../shared/texts');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.error('SMTP verification failed:', error);
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

const getEmailContent = (role, inviteUrl, language = 'en') => {
  const t = emailTexts.invitation;
  return {
    subject: t.emailSubject[language],
    html: `
      <h1>${t.emailTitle[language]}</h1>
      <p>${t.emailMessage[language]} ${emailTexts.roles[role][language].toLowerCase()}.</p>
      <p>${t.emailAction[language]}</p>
      <a href="${inviteUrl}">${inviteUrl}</a>
      <p>${t.emailExpiry[language]}</p>
    `,
  };
};

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

router.post('/', auth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const { email, role, language = 'en' } = req.body;

    // Create invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // Token expires in 48 hours

    // Insert invitation
    await client.query(
      'INSERT INTO invitations (email, token, role, expires_at) VALUES ($1, $2, $3, $4)',
      [email, token, role, expiresAt]
    );

    // Send invitation email
    const inviteUrl = `${process.env.FRONTEND_URL}/register/invite/${token}`;
    const emailContent = getEmailContent(role, inviteUrl, language);

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    await client.query('COMMIT');
    res.status(201).json({ message: 'Invitation sent successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating invitation:', error);
    res.status(500).json({ error: 'Failed to create invitation' });
  } finally {
    client.release();
  }
});

router.post('/register/:token', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const { token } = req.params;
    const { firstname, surname, password } = req.body;

    // Find and validate invitation
    const invitation = await client.query(
      'SELECT * FROM invitations WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (invitation.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    const { email, role } = invitation.rows[0];

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await client.query(
      'INSERT INTO users (email, firstname, surname, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role',
      [email, firstname, surname, hashedPassword, role]
    );

    // Delete used invitation
    await client.query('DELETE FROM invitations WHERE token = $1', [token]);

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  } finally {
    client.release();
  }
});

module.exports = router;
