import { randomBytes } from 'crypto';
import process from 'process';
import nodemailer from 'nodemailer';
import getInvitationEmail from '#backend/templates/invitationEmail.js';

const { createTransport } = nodemailer;

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const generateInvitationToken = () => {
  return randomBytes(32).toString('hex');
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
    from: `EduMont <${process.env.SMTP_FROM}>`,
    to: email,
    subject: emailContent.subject,
    html: emailContent.html,
  });
};

export default {
  generateInvitationToken,
  createInvitationExpiry,
  sendInvitationEmail,
};
