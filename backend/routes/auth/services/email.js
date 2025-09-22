/* eslint-disable */
const { sendEmail } = require('../../../config/mail');
const getForgotPasswordEmail = require('../../../templates/forgotPasswordEmail');

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

module.exports = {
  sendPasswordResetEmail,
};
