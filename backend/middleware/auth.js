/* eslint-disable */
const jwt = require('jsonwebtoken');
const pool = require('../config/database'); // Fixed path to database configuration

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);

    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user.rows[0];

    // Check if user needs to complete admission process
    const isAdmissionRoute = req.path.startsWith('/api/admission');
    if (
      req.user.role === 'parent' &&
      req.user.admission_status !== 'completed' &&
      !isAdmissionRoute &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        error: 'admission_required',
        message: 'Please complete the admission process',
      });
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = auth;
