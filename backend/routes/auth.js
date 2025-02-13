/* eslint-disable */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { sendEmail } = require('../config/mail');
const getForgotPasswordEmail = require('../templates/forgotPasswordEmail');
const auth = require('../middleware/auth'); // Add this line to import auth middleware

router.post('/auth/login', async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await client.query('SELECT * FROM users WHERE email = $1', [
      email.toLowerCase(),
    ]);

    if (result.rows.length === 0) {
      console.log('Login failed: User not found -', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('Login failed: Invalid password -', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        surname: user.surname,
        role: user.role,
        admission_status: user.role === 'parent' ? user.admission_status : null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error during login process' });
  } finally {
    client.release();
  }
});

router.post('/signup', async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Start transaction
    await client.query('BEGIN');

    // Check if user already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const insertQuery = `
      INSERT INTO users (email, password, firstname, surname, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, firstname, surname, role`;

    const result = await client.query(insertQuery, [
      email.toLowerCase(),
      hashedPassword,
      firstName,
      lastName,
      'parent',
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        firstname: result.rows[0].firstname,
        surname: result.rows[0].surname,
        role: result.rows[0].role,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Registration failed', details: err.message });
  } finally {
    client.release();
  }
});

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
    const resetToken = crypto.randomBytes(32).toString('hex');

    await client.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = NOW() + interval '1 hour' WHERE id = $2",
      [resetToken, user.id]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const emailData = getForgotPasswordEmail(resetUrl, language || 'en');

    await sendEmail({
      to: user.email,
      subject: emailData.subject,
      html: emailData.html,
      from: `EduMont <${process.env.SMTP_FROM}>`,
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process password reset request',
    });
  } finally {
    client.release();
  }
});

router.get('/me', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    // Get user data including admission status and current step
    const result = await client.query(
      `
      SELECT 
        u.id, 
        u.email, 
        u.firstname, 
        u.surname, 
        u.role,
        u.admission_status,
        CASE WHEN u.role = 'parent' AND u.admission_status IN ('pending', 'in_progress') THEN
          (SELECT ap.status
           FROM admission_progress ap
           JOIN admission_steps asteps ON ap.step_id = asteps.id
           WHERE ap.user_id = u.id
           ORDER BY asteps.order_index DESC
           LIMIT 1)
        ELSE NULL END as current_step_status
      FROM users u
      WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  } finally {
    client.release();
  }
});

module.exports = router;
