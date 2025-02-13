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
  messageNotification: {
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
  },
  invitation: {
    subject: {
      cs: 'Pozvánka do systému EduMont',
      en: 'Invitation to EduMont',
    },
    title: {
      cs: 'Vítejte v EduMont',
      en: 'Welcome to EduMont',
    },
    message: {
      cs: 'Byli jste pozváni do systému EduMont jako',
      en: 'You have been invited to join EduMont as a',
    },
    action: {
      cs: 'Pro dokončení registrace klikněte na tento odkaz:',
      en: 'Please click the link below to complete your registration:',
    },
    expiry: {
      cs: 'Tento odkaz vyprší za 48 hodin.',
      en: 'This link will expire in 48 hours.',
    },
    button: {
      cs: 'Dokončit registraci',
      en: 'Complete Registration',
    },
    footer: {
      cs: 'Všechna práva vyhrazena.',
      en: 'All rights reserved.',
    },
  },
  forgotPassword: {
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
  },
};

module.exports = emailTexts;
