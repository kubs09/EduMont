/* eslint-disable */
const emailTexts = require('./emailTexts');

const getAdmissionResultEmail = (isApproved, denialReason = null, language = 'cs') => {
  // Ensure language is valid
  const validLanguage = ['cs', 'en'].includes(language) ? language : 'cs';

  const texts = emailTexts.admissionResult;
  const commonTexts = texts.common;
  const specificTexts = isApproved ? texts.approved : texts.denied;

  const emailStyle = `
    <style>
      .email-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
      .email-header { background: #2c5282; color: white; padding: 20px; text-align: center; border-radius: 5px; }
      .email-content { padding: 20px; background: #f7fafc; border-radius: 5px; margin: 20px 0; }
      .email-footer { text-align: center; padding: 20px; color: #718096; }
      .reason-box { background: #fed7d7; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
  `;

  let content = `
    <!DOCTYPE html>
    <html lang="${validLanguage}">
    <head>
      <meta charset="UTF-8">
      ${emailStyle}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>${specificTexts.title[validLanguage]}</h1>
        </div>
        <div class="email-content">
          <p>${specificTexts.message[validLanguage]} EduMont ${
    isApproved ? specificTexts.nextSteps[validLanguage] : specificTexts.regret[validLanguage]
  }</p>
  `;

  if (!isApproved && denialReason) {
    content += `
      <div class="reason-box">
        <strong>${specificTexts.reason[validLanguage]}:</strong><br>
        ${denialReason}
      </div>
    `;
  }

  content += `
          <p>${commonTexts.questions[validLanguage]}</p>
          <p>
            ${commonTexts.regards[validLanguage]},<br>
            ${commonTexts.team[validLanguage]}
          </p>
        </div>
        <div class="email-footer">
          &copy; ${new Date().getFullYear()} EduMont
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    subject: specificTexts.subject[validLanguage],
    html: content,
  };
};

module.exports = getAdmissionResultEmail;
