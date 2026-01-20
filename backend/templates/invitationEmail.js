/* eslint-disable */
const sharedTexts = require('../../shared/texts');

const emailTexts = {
  emailSubject: {
    cs: 'Pozvánka do systému EduMont',
    en: 'Invitation to EduMont',
  },
  emailTitle: {
    cs: 'Vítejte v EduMont',
    en: 'Welcome to EduMont',
  },
  emailMessage: {
    cs: 'Byli jste pozváni do systému EduMont jako',
    en: 'You have been invited to join EduMont as a',
  },
  emailAction: {
    cs: 'Pro dokončení registrace klikněte na tento odkaz:',
    en: 'Please click the link below to complete your registration:',
  },
  emailExpiry: {
    cs: 'Tento odkaz vyprší za 48 hodin.',
    en: 'This link will expire in 48 hours.',
  },
  emailButtonText: {
    cs: 'Dokončit registraci',
    en: 'Complete Registration',
  },
  emailFooter: {
    cs: 'Všechna práva vyhrazena.',
    en: 'All rights reserved.',
  },
};

const getInvitationEmail = (role, inviteUrl, language = 'en') => {
  return {
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
              <p>${emailTexts.emailMessage[language]} ${sharedTexts.roles[role][
      language
    ].toLowerCase()}.</p>
              <p>${emailTexts.emailAction[language]}</p>
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">
                  ${emailTexts.emailButtonText[language]}
                </a>
              </div>
              <p style="font-size: 0.875rem; color: #4A5568;">
                ${emailTexts.emailExpiry[language]}
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} EduMont. ${emailTexts.emailFooter[language]}</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
};

module.exports = getInvitationEmail;
