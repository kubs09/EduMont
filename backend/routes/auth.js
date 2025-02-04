/* eslint-disable */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/database');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', {
      email,
      password,
      passwordLength: password.length,
      trimmedLength: password.trim().length,
    });

    const result = await pool.query(
      'SELECT id, email, password as hash, firstname, surname, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log('Found user:', {
      id: user.id,
      email: user.email,
      role: user.role,
      hash: user.hash, // Log the stored hash for debugging
    });

    const validPassword = await bcrypt.compare(password.trim(), user.hash);
    console.log('Password comparison:', {
      inputPassword: password,
      trimmedPassword: password.trim(),
      hash: user.hash,
      isValid: validPassword,
      bcryptVersion: bcrypt.getRounds(user.hash),
    });

    if (!validPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({
      token,
      id: user.id,
      firstname: user.firstname,
      surname: user.surname,
      role: user.role,
      email: user.email,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
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

module.exports = router;
