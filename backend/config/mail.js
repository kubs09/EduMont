/* eslint-disable */
const nodemailer = require('nodemailer');
const { validateLanguage } = require('../utils/language');
const getInvitationEmail = require('../templates/invitationEmail');
const getMessageNotificationEmail = require('../templates/messageNotificationEmail');
const getForgotPasswordEmail = require('../templates/forgotPasswordEmail');
const getAdmissionResultEmail = require('../templates/admissionResultEmail');
const emailTexts = require('../templates/emailTexts');

const EDUMONT_SENDER = `EduMont <${process.env.SMTP_FROM}>`;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify().catch((error) => console.error('SMTP verification failed:', error));

const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: EDUMONT_SENDER,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

/**
 * @typedef {Object} SenderInfo
 * @property {string} language - The sender's preferred language
 */

const sendInvitationEmail = async (email, role, token, senderInfo = {}) => {
  const language = validateLanguage(senderInfo.language);
  const inviteUrl = `${process.env.FRONTEND_URL}/register/invite/${token}`;
  const emailContent = getInvitationEmail(role, inviteUrl, language);
  return sendEmail({
    to: email,
    ...emailContent,
  });
};

const sendMessageNotification = async (recipientEmail, senderName, messageId, senderInfo = {}) => {
  const language = validateLanguage(senderInfo.language);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const emailContent = getMessageNotificationEmail(senderName, messageId, frontendUrl, language);
  return sendEmail({
    to: recipientEmail,
    ...emailContent,
  });
};

const sendPasswordResetEmail = async (email, resetToken, senderInfo = {}) => {
  const language = validateLanguage(senderInfo.language || 'en');
  console.log('Sending password reset email in language:', language); // Debug log

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const emailContent = getForgotPasswordEmail(resetUrl, language);

  return sendEmail({
    to: email,
    ...emailContent,
  });
};

const sendAdmissionResultEmail = async (
  admission,
  isApproved,
  denialReason = null,
  senderInfo = {}
) => {
  const language = validateLanguage(senderInfo.language);
  const emailContent = getAdmissionResultEmail(isApproved, denialReason, language);
  return sendEmail({
    to: admission.email,
    ...emailContent,
  });
};

module.exports = {
  sendEmail,
  sendInvitationEmail,
  sendMessageNotification,
  sendPasswordResetEmail,
  sendAdmissionResultEmail,
  EDUMONT_SENDER,
};
