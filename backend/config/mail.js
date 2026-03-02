import { createTransport } from 'nodemailer';
import process from 'process';
import console from 'console';

const smtpPort = Number(process.env.SMTP_PORT ?? '587');
if (!Number.isInteger(smtpPort) || smtpPort <= 0) {
  console.error('Invalid SMTP_PORT:', process.env.SMTP_PORT);
  throw new Error('SMTP_PORT must be a positive integer');
}

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
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

export const sendEmail = async ({ to, subject, html, from }) => {
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

export default { sendEmail };
