/*eslint-disable */
const nodemailer = require('nodemailer');

// Create transporter with Gmail settings
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Use SMTP_PASS instead of SMTP_APP_PASSWORD to match .env
  },
});

// Simple email sending function with proper error handling
const sendEmail = async ({ to, subject, html, from }) => {
  try {
    const mailOptions = {
      from: from || process.env.SMTP_FROM,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', {
      error: error.message,
      errorCode: error.code,
      errorResponse: error.response,
    });
    throw error;
  }
};

// Verify SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP verification failed:', error.message);
  } else {
    console.log('SMTP server is ready to accept messages');
  }
});

module.exports = { sendEmail, transporter };
