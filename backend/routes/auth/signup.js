import { Router } from 'express';
const router = Router();
import console from 'console';
import pool from '../../config/database.js';
import passwordService from './services/password.js';
import validationService from './services/validation.js';

const { hashPassword } = passwordService;
const { validateSignupData } = validationService;

router.post('/signup', async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password, firstName, lastName } = req.body;

    const validation = validateSignupData(email, password, firstName, lastName);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }
    await client.query('BEGIN');

    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await hashPassword(password);

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

export default router;
