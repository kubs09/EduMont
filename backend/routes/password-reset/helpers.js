import { randomBytes } from 'crypto';

export const generateResetToken = () => randomBytes(32).toString('hex');
