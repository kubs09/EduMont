/* eslint-disable */
const emailTexts = require('./emailTexts');

const getMessageNotificationEmail = (senderName, messageId, frontendUrl, language = 'cs') => {
  // Ensure language is valid
  const validLanguage = ['cs', 'en'].includes(language) ? language : 'cs';
  const translations = emailTexts.messageNotification;
  const viewUrl = `${frontendUrl}/messages/${messageId}`;

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
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #F7FAFC;
              padding: 20px;
              text-align: center;
            }
            .button {
              display: inline-block;
              background-color: #2B6CB0;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h2>${translations.subject[validLanguage]}</h2>
            </div>
            <div class="content">
              <p><b>${translations.from[validLanguage]}</></p>
              <h3>${senderName}</h3>
              <p>${translations.instruction[validLanguage]}</p>
              <a href="${viewUrl}" style="color: white" class="button">
                ${translations.viewMessage[validLanguage]}
              </a>
              <p>${translations.notinterested[validLanguage]}</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
};

module.exports = getMessageNotificationEmail;
