/* eslint-disable */
const emailTexts = {
  admissionResult: {
    approved: {
      subject: {
        cs: 'Vaše žádost o přijetí do EduMont byla schválena',
        en: 'Your EduMont Admission Request Has Been Approved',
      },
      title: {
        cs: 'Žádost schválena!',
        en: 'Admission Approved!',
      },
      greeting: {
        cs: 'Vážený/á',
        en: 'Dear',
      },
      message: {
        cs: 'S potěšením Vám oznamujeme, že žádost o přijetí pro',
        en: 'We are pleased to inform you that your admission request for',
      },
      nextSteps: {
        cs: 'byla schválena! V brzké době obdržíte další email s instrukcemi k dokončení registrace.',
        en: 'has been approved! You will receive a separate email shortly with instructions to complete your registration.',
      },
    },
    denied: {
      subject: {
        cs: 'Aktualizace vaší žádosti o přijetí do EduMont',
        en: 'Update Regarding Your EduMont Admission Request',
      },
      title: {
        cs: 'Aktualizace žádosti',
        en: 'Admission Update',
      },
      message: {
        cs: 'Přezkoumali jsme Vaši žádost o přijetí pro',
        en: 'We have reviewed your admission request for',
      },
      regret: {
        cs: 'a s politováním Vám musíme oznámit, že v tuto chvíli nemůžeme pokračovat v přijímacím řízení.',
        en: 'and regret to inform you that we are unable to proceed with the admission at this time.',
      },
      reason: {
        cs: 'Důvod',
        en: 'Reason',
      },
    },
    common: {
      questions: {
        cs: 'V případě jakýchkoliv dotazů nás neváhejte kontaktovat.',
        en: "If you have any questions, please don't hesitate to contact us.",
      },
      regards: {
        cs: 'S pozdravem',
        en: 'Best regards',
      },
      team: {
        cs: 'Tým EduMont',
        en: 'The EduMont Team',
      },
    },
  },
};

module.exports = emailTexts;
