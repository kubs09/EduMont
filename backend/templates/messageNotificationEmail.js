/* eslint-disable */
const getMessageNotificationEmail = (senderName, messageId, frontendUrl, language = 'en') => {
  const translations = {
    subject: {
      cs: 'Dostali jste novou zprávu',
      en: 'You have received a new message',
    },
    from: {
      cs: 'Od',
      en: 'From',
    },
    footer: {
      cs: 'Všechna práva vyhrazena.',
      en: 'All rights reserved.',
    },
    viewMessage: {
      cs: 'Zobrazit zprávu',
      en: 'View Message',
    },
    instruction: {
      cs: 'Pro přístup do aplikace můžete kliknout na tlačítko níže',
      en: 'You can click the button below to get to the application',
    },
    notinterested: {
      cs: 'Pokud tyto upozornění nechcete dostávat, můžete je vypnout v nastavení ve vašem profilu.',
      en: 'If you do not want to receive these notifications, you can turn them off in the settings in your profile.',
    },
  };

  const viewUrl = `${frontendUrl}/messages/${messageId}`;

  return {
    subject: `${translations.subject[language]}`,
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
              <h2>${translations.subject[language]}</h2>
            </div>
            <div class="content">
              <p><b>${translations.from[language]}</></p>
              <h3>${senderName}</h3>
              <p>${translations.instruction[language]}</p>
              <a href="${viewUrl}" style="color: white" class="button">
                ${translations.viewMessage[language]}
              </a>
              <p>${translations.notinterested[language]}</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
};

module.exports = getMessageNotificationEmail;
