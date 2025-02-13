/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const getInvitationEmail = require('../templates/invitationEmail');

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

const generateInvitationToken = () => crypto.randomBytes(32).toString('hex');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, firstname, surname, email, role FROM users ORDER BY surname ASC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put('/:id', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (parseInt(id) !== userId) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const { firstname, surname, email, phone, admission_status } = req.body;

    // Get current user data
    const currentUser = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (currentUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Use current values if not provided in request
    const updatedData = {
      firstname: firstname || currentUser.rows[0].firstname,
      surname: surname || currentUser.rows[0].surname,
      email: email ? email.toLowerCase() : currentUser.rows[0].email,
      phone: phone === undefined ? currentUser.rows[0].phone : phone,
      admission_status: admission_status || currentUser.rows[0].admission_status,
    };

    // Validate phone format if provided
    if (
      updatedData.phone &&
      !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(updatedData.phone)
    ) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Validate admission_status if provided
    if (
      admission_status &&
      !['pending', 'in_progress', 'completed', 'rejected'].includes(admission_status)
    ) {
      return res.status(400).json({ error: 'Invalid admission status' });
    }

    const result = await client.query(
      `UPDATE users 
       SET firstname = $1, 
           surname = $2, 
           email = $3, 
           phone = $4,
           admission_status = $5
       WHERE id = $6 
       RETURNING id, firstname, surname, email, phone, role, admission_status`,
      [
        updatedData.firstname,
        updatedData.surname,
        updatedData.email,
        updatedData.phone,
        updatedData.admission_status,
        userId,
      ]
    );

    // Initialize admission progress if status changed to in_progress
    if (
      updatedData.admission_status === 'in_progress' &&
      currentUser.rows[0].admission_status !== 'in_progress'
    ) {
      try {
        await client.query('SELECT initialize_admission_progress($1)', [userId]);
      } catch (initError) {
        console.error('Error initializing admission progress:', initError);
        // Continue even if initialization fails, as records might already exist
      }
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
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

    const validPassword = await bcrypt.compare(currentPassword, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Add this new route for notification settings
router.put('/:id/notifications', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { messageNotifications } = req.body;
    const userId = parseInt(req.params.id);

    // Verify user is updating their own settings
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

router.post('/', auth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const { email, role, language = 'en' } = req.body;

    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'user_exists' });
    }

    const existingInvitation = await client.query(
      'SELECT id FROM invitations WHERE email = $1 AND expires_at > NOW()',
      [email]
    );
    if (existingInvitation.rows.length > 0) {
      return res.status(409).json({ error: 'invitation_exists' });
    }

    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    await client.query(
      'INSERT INTO invitations (email, token, role, expires_at) VALUES ($1, $2, $3, $4)',
      [email, token, role, expiresAt]
    );

    const inviteUrl = `${process.env.FRONTEND_URL}/register/invite/${token}`;
    const emailContent = getInvitationEmail(role, inviteUrl, language);

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
    console.error('Invitation error:', error);
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

    const invitation = await client.query(
      'SELECT * FROM invitations WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (invitation.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    const { email, role } = invitation.rows[0];

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with pending admission status
    const result = await client.query(
      'INSERT INTO users (email, firstname, surname, password, role, admission_status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role',
      [email, firstname, surname, hashedPassword, role, 'pending']
    );

    // Initialize admission progress for parent users
    if (role === 'parent') {
      await client.query('SELECT initialize_admission_progress($1)', [result.rows[0].id]);
    }

    await client.query('DELETE FROM invitations WHERE token = $1', [token]);

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  } finally {
    client.release();
  }
});

module.exports = router;
