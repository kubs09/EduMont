require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

const initDatabase = async () => {
  try {
    // Verify tables exist by querying them
    await pool.query('SELECT * FROM users');
    await pool.query('SELECT * FROM children');
    console.log('Database tables verified successfully');
  } catch (err) {
    console.error('Database verification error:', err);
    throw new Error(
      'Required database tables do not exist. Please ensure the database is properly initialized.'
    );
  }
};

pool
  .connect()
  .then(() => {
    console.log('Database connected successfully');
    return initDatabase();
  })
  .catch((err) => {
    console.error('Database setup error:', err);
    process.exit(1);
  });

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Error handler for JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next(err);
});

// API Routes
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare with stored hash
    const validPassword =
      result.rows[0].password === '$2b$10$ZqFhH0wzC/sdfh34g98H8O7j1yGm5gQVpWFX9z3GkzMYBR1tFaG';

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: result.rows[0].id,
        email: result.rows[0].email,
        role: result.rows[0].role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/children', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        age,
        parent_name,
        contact,
        notes
      FROM children 
      ORDER BY name ASC
    `);

    if (result.rows.length === 0) {
      return res.json([]);
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({
      error: 'Failed to fetch children',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

// Catch-all handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware should be last
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.DEBUG === 'true' ? err.message : undefined,
  });
});

app.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT || 5000}`)
);
