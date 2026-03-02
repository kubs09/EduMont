import { createTransport } from 'nodemailer';
import process from 'process';
import console from 'console';

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

export default { sendEmail, transporter };
