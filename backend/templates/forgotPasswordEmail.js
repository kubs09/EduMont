/* eslint-disable */
const sharedTexts = require('../../shared/texts');

const emailTexts = {
  emailSubject: {
    cs: 'Obnovení hesla EduMont',
    en: 'EduMont Password Reset',
  },
  emailTitle: {
    cs: 'Obnovení hesla',
    en: 'Password Reset',
  },
  emailMessage: {
    cs: 'Obdrželi jsme žádost o obnovení hesla pro váš účet.',
    en: 'We received a request to reset the password for your account.',
  },
  emailAction: {
    cs: 'Pro obnovení hesla klikněte na tento odkaz:',
    en: 'Click the link below to reset your password:',
  },
  emailExpiry: {
    cs: 'Tento odkaz vyprší za 1 hodinu.',
    en: 'This link will expire in 1 hour.',
  },
  emailButtonText: {
    cs: 'Obnovit heslo',
    en: 'Reset Password',
  },
  emailFooter: {
    cs: 'Všechna práva vyhrazena.',
    en: 'All rights reserved.',
  },
  emailIgnore: {
    cs: 'Pokud jste o obnovení hesla nežádali, tento email můžete ignorovat.',
    en: 'If you did not request a password reset, you can ignore this email.',
  },
};

// Change to match the invitation email pattern
const getForgotPasswordEmail = (resetUrl, language) => ({
  subject: emailTexts.emailSubject[language],
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            font-family: Arial, sans-serif;
            line-height: 1.6;
          }
          .header {
            background-color: #2B6CB0;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background-color: #F7FAFC;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .button {
            display: inline-block;
            background-color: #2B6CB0;
            color: white !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #718096;
            font-size: 0.875rem;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1 style="margin: 0;">${emailTexts.emailTitle[language]}</h1>
          </div>
          <div class="content">
            <p>${emailTexts.emailMessage[language]}</p>
            <p>${emailTexts.emailAction[language]}</p>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetUrl}" class="button">
                ${emailTexts.emailButtonText[language]}
              </a>
            </div>
            <p style="font-size: 0.875rem; color: #4A5568;">
              ${emailTexts.emailExpiry[language]}
            </p>
            <p style="font-size: 0.875rem; color: #718096;">
              ${emailTexts.emailIgnore[language]}
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} EduMont. ${emailTexts.emailFooter[language]}</p>
          </div>
        </div>
      </body>
    </html>
  `,
});

module.exports = getForgotPasswordEmail;
