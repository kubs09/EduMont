import jsonwebtoken from 'jsonwebtoken';
import crypto from 'crypto';
import process from 'process';

const { sign } = jsonwebtoken;
const { randomBytes } = crypto;

const generateJwtToken = (user) => {
  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT_SECRET is not configured');
    error.code = 'JWT_SECRET_MISSING';
    throw error;
  }

  return sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};

const generateResetToken = () => {
  return randomBytes(32).toString('hex');
};

export default {
  generateJwtToken,
  generateResetToken,
};
