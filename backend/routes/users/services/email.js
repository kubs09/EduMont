import { randomBytes } from 'crypto';
import process from 'process';
import { sendEmail } from '#backend/config/mail.js';
import getInvitationEmail from '#backend/templates/invitationEmail.js';

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

  return await sendEmail({
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
