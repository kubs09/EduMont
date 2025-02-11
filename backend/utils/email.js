/* eslint-disable */
const { sendEmail } = require('../config/mail');
const getInvitationEmail = require('../templates/invitationEmail');
const emailTexts = require('../templates/emailTexts');

const sendInvitationEmail = async ({ email, firstname, surname, role }) => {
  const inviteUrl = `${process.env.FRONTEND_URL}/register/invite/${generateToken(email)}`;
  const emailContent = getInvitationEmail(role, inviteUrl);
  await sendEmail({
    to: email,
    ...emailContent,
  });
};

const sendAdmissionResultEmail = async (
  admission,
  isApproved,
  denialReason = null,
  language = 'cs'
) => {
  const texts = emailTexts.admissionResult;
  const subject = isApproved ? texts.approved.subject[language] : texts.denied.subject[language];

  const html = `
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
            background-color: ${isApproved ? '#48BB78' : '#E53E3E'};
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background-color: #F7FAFC;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1 style="margin: 0;">
              ${isApproved ? texts.approved.title[language] : texts.denied.title[language]}
            </h1>
          </div>
          <div class="content">
            <p>${texts.approved.greeting[language]} ${admission.firstname} ${admission.surname},</p>
            ${
              isApproved
                ? `<p>${texts.approved.message[language]} ${admission.child_firstname} ${texts.approved.nextSteps[language]}</p>`
                : `<p>${texts.denied.message[language]} ${admission.child_firstname} ${texts.denied.regret[language]}</p>
                   <p>${texts.denied.reason[language]}: ${denialReason}</p>`
            }
            <p>${texts.common.questions[language]}</p>
            <p>${texts.common.regards[language]},<br>${texts.common.team[language]}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: admission.email,
    subject,
    html,
  });
};

module.exports = {
  sendInvitationEmail,
  sendAdmissionResultEmail,
};
