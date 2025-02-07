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
});

transporter.verify().catch((error) => console.error('SMTP verification failed:', error));

const sendEmail = async ({ to, subject, html, from }) => {
  try {
    const mailOptions = {
      from: from || `EduMont <${process.env.SMTP_FROM}>`,
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

module.exports = { sendEmail, transporter };
