/* eslint-disable */
const crypto = require('crypto');

const generateResetToken = () => crypto.randomBytes(32).toString('hex');

module.exports = { generateResetToken };
