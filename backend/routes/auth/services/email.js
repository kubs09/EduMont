import mailService from '#backend/config/mail.js';
import getForgotPasswordEmail from '#backend/templates/forgotPasswordEmail.js';
import process from 'process';

const { sendEmail } = mailService;

const sendPasswordResetEmail = async (userEmail, resetToken, language = 'en') => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const emailData = getForgotPasswordEmail(resetUrl, language);

  await sendEmail({
    to: userEmail,
    subject: emailData.subject,
    html: emailData.html,
    from: `EduMont <${process.env.SMTP_FROM}>`,
  });
};

export default {
  sendPasswordResetEmail,
};
