/* eslint-disable */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateJwtToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  generateJwtToken,
  generateResetToken,
};
