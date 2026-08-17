import { common } from './common';

export const signUp = {
  errors: {
    registrationFailed: {
      title: {
        cs: 'Chyba při registraci',
        en: 'Registration Error',
      },
      description: {
        cs: 'Nepodařilo se dokončit registraci. Zkuste to prosím později.',
        en: 'Failed to complete registration. Please try again later.',
      },
    },
  },
  success: {
    registered: {
      title: {
        cs: 'Registrace dokončena',
        en: 'Registration Complete',
      },
      description: {
        cs: 'Váš účet byl úspěšně vytvořen. Nyní se můžete přihlásit.',
        en: 'Your account has been created successfully. You can now log in.',
      },
    },
  },
  validation: {
    firstNameMinLength: common.templates.validation.minLength(
      { cs: 'Jméno', en: 'First name' },
      2,
    ),
    lastNameMinLength: common.templates.validation.minLength(
      { cs: 'Příjmení', en: 'Last name' },
      2,
    ),
    passwordLength: common.templates.validation.minLength({ cs: 'Heslo', en: 'Password' }, 8),
    passwordsMatch: {
      cs: 'Hesla se neshodují',
      en: "Passwords don't match",
    },
  },
  title: {
    cs: 'Dokončení registrace',
    en: 'Complete Registration',
  },
  description: {
    cs: 'Pro registraci zadejte své údaje a vytvořte si účet.',
    en: 'For registration, enter your details and create an account.',
  },
  form: {
    firstName: {
      cs: 'Jméno',
      en: 'First Name',
    },
    lastName: {
      cs: 'Příjmení',
      en: 'Last Name',
    },
    password: {
      cs: 'Heslo',
      en: 'Password',
    },
    submit: {
      cs: 'Dokončit registraci',
      en: 'Complete Registration',
    },
  },
};
