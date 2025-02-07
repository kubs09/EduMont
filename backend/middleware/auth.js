/* eslint-disable */
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    console.log('Auth headers:', req.headers);
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log('No auth header found');
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Authentication failed', details: error.message });
  }
};

module.exports = auth;
