import jsonwebtoken from 'jsonwebtoken';
import process from 'process';

export const signTestToken = (user) =>
  jsonwebtoken.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
