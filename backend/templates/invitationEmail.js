/* eslint-disable */
const sharedTexts = require('../../shared/texts');
const emailTexts = require('./emailTexts');

const getInvitationEmail = (role, inviteUrl, language = 'cs') => {
  // Ensure language is valid
  const validLanguage = ['cs', 'en'].includes(language) ? language : 'cs';
  const translations = emailTexts.invitation;

  return {
    subject: translations.subject[validLanguage],
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
              <h1 style="margin: 0;">${translations.title[validLanguage]}</h1>
            </div>
            <div class="content">
              <p>${translations.message[validLanguage]} ${sharedTexts.roles[role][
      validLanguage
    ].toLowerCase()}.</p>
              <p>${translations.action[validLanguage]}</p>
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">
                  ${translations.button[validLanguage]}
                </a>
              </div>
              <p style="font-size: 0.875rem; color: #4A5568;">
                ${translations.expiry[validLanguage]}
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} EduMont. ${translations.footer[validLanguage]}</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
};

module.exports = getInvitationEmail;
