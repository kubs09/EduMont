import { randomBytes } from 'crypto';

const generateResetToken = () => randomBytes(32).toString('hex');

export default { generateResetToken };
