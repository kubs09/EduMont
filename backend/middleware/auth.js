/* eslint-disable */
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
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
    if (error.name === 'TokenExpiredError') {
      console.log('Token expired:', error.expiredAt);
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt,
      });
    } else if (error.name === 'JsonWebTokenError') {
      console.log('Invalid token:', error.message);
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        details: error.message,
      });
    } else {
      console.error('Auth error:', error);
      return res.status(401).json({
        error: 'Authentication failed',
        code: 'AUTH_FAILED',
        details: error.message,
      });
    }
  }
};

module.exports = auth;
