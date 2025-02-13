/* eslint-disable */
const emailTexts = require('./emailTexts');

const getForgotPasswordEmail = (resetUrl, language = 'cs') => {
  // Ensure language is valid
  const validLanguage = ['cs', 'en'].includes(language) ? language : 'cs';
  const translations = emailTexts.forgotPassword;

  return {
    subject: translations.subject[validLanguage],
    html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 20px; background-color: #f7fafc; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 5px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background-color: #2B6CB0; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">${translations.title[validLanguage]}</h1>
        </div>
        <div style="padding: 20px; text-align: center;">
            <p style="color: #4a5568; font-size: 16px; margin-bottom: 24px;">
                ${translations.message[validLanguage]}
            </p>
            <p style="color: #4a5568; font-size: 16px; margin-bottom: 24px;">
                ${translations.action[validLanguage]}
            </p>
            <a href="${resetUrl}" 
               style="display: inline-block; background-color: #2B6CB0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                ${translations.button[validLanguage]}
            </a>
        </div>
    </div>
</body>
</html>`,
  };
};

module.exports = getForgotPasswordEmail;
