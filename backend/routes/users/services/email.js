/* eslint-disable */
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const getInvitationEmail = require('../../../templates/invitationEmail');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const generateInvitationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const createInvitationExpiry = (hoursFromNow = 48) => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hoursFromNow);
  return expiresAt;
};

const sendInvitationEmail = async (email, role, token, language = 'en') => {
  const inviteUrl = `${process.env.FRONTEND_URL}/register/invite/${token}`;
  const emailContent = getInvitationEmail(role, inviteUrl, language);

  return await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: emailContent.subject,
    html: emailContent.html,
  });
};

module.exports = {
  generateInvitationToken,
  createInvitationExpiry,
  sendInvitationEmail,
};
