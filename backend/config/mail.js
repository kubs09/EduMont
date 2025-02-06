/*eslint-disable */
const nodemailer = require('nodemailer');

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
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development',
});

const sendEmail = async ({ to, subject, html, from }) => {
  try {
    if (!to || !subject || !html) {
      throw new Error('Missing required email parameters');
    }

    const mailOptions = {
      from: from || process.env.SMTP_FROM,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    throw error;
  }
};

module.exports = { sendEmail, transporter };
