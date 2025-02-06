/* eslint-disable */
const getForgotPasswordEmail = (resetUrl, language = 'en') => {
  const translations = {
    subject: {
      cs: 'Obnovení hesla EduMont',
      en: 'EduMont Password Reset',
    },
    title: {
      cs: 'Obnovení hesla',
      en: 'Password Reset',
    },
    message: {
      cs: 'Obdrželi jsme žádost o obnovení hesla pro váš účet.',
      en: 'We received a request to reset the password for your account.',
    },
    action: {
      cs: 'Pro obnovení hesla klikněte na tlačítko níže:',
      en: 'Click the button below to reset your password:',
    },
    button: {
      cs: 'Obnovit heslo',
      en: 'Reset Password',
    },
  };

  return {
    subject: translations.subject[language],
    html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 20px; background-color: #f7fafc; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 5px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background-color: #2B6CB0; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">${translations.title[language]}</h1>
        </div>
        <div style="padding: 20px; text-align: center;">
            <p style="color: #4a5568; font-size: 16px; margin-bottom: 24px;">
                ${translations.message[language]}
            </p>
            <p style="color: #4a5568; font-size: 16px; margin-bottom: 24px;">
                ${translations.action[language]}
            </p>
            <a href="${resetUrl}" 
               style="display: inline-block; background-color: #2B6CB0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                ${translations.button[language]}
            </a>
        </div>
    </div>
</body>
</html>`,
  };
};

module.exports = getForgotPasswordEmail;
