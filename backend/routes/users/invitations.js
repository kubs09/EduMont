/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');
const { hashPassword } = require('./services/password');
const {
  generateInvitationToken,
  createInvitationExpiry,
  sendInvitationEmail,
} = require('./services/email');

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
    const expiresAt = createInvitationExpiry(48);

    await client.query(
      'INSERT INTO invitations (email, token, role, expires_at) VALUES ($1, $2, $3, $4)',
      [email, token, role, expiresAt]
    );

    await sendInvitationEmail(email, role, token, language);

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

    const hashedPassword = await hashPassword(password);

    const result = await client.query(
      'INSERT INTO users (email, firstname, surname, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role',
      [email, firstname, surname, hashedPassword, role]
    );

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
