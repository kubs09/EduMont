/* eslint-disable */
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ error: 'No auth token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query('SELECT id, role, admission_status FROM users WHERE id = $1', [
      decoded.id,
    ]);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    req.user = {
      id: decoded.id,
      role: result.rows[0].role,
      admission_status: result.rows[0].admission_status,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};
