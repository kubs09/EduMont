/* eslint-disable */
const nodemailer = require('nodemailer');
const getInvitationEmail = require('../templates/invitationEmail');
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

const sendInvitationEmail = async ({ email, firstname, surname, role }) => {
  const inviteUrl = `${process.env.FRONTEND_URL}/register/invite/${generateToken(email)}`;
  const emailContent = getInvitationEmail(role, inviteUrl);
  await sendEmail({
    to: email,
    ...emailContent,
  });
};

const sendAdmissionResultEmail = async (
  admission,
  isApproved,
  denialReason = null,
  language = 'cs'
) => {
  await sendEmail({
    to: admission.email,
    subject,
    html,
  });
};

module.exports = {
  sendEmail,
  sendInvitationEmail,
  sendAdmissionResultEmail,
  EDUMONT_SENDER,
};
