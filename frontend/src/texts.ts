type TextKey = {
  cs: string;
  en: string;
};

export const texts = {
  auth: {
    signIn: {
      title: {
        cs: 'Přihlášení',
        en: 'Sign In',
      },
      emailPlaceholder: {
        cs: 'Emailová adresa',
        en: 'Email Address',
      },
      passwordPlaceholder: {
        cs: 'Heslo',
        en: 'Password',
      },
      submitButton: {
        cs: 'Přihlásit se',
        en: 'Sign In',
      },
      serverError: {
        cs: 'Nepodařilo se připojit k serveru. Zkuste to prosím později.',
        en: 'Unable to connect to the server. Please try again later.',
      },
    },
    login: {
      cs: 'Přihlásit',
      en: 'Login',
    },
    logout: {
      cs: 'Odhlásit',
      en: 'Logout',
    },
  },
  unauthorized: {
    title: {
      cs: 'Přístup zamítnut',
      en: 'Access Denied',
    },
    subtitle: {
      cs: '401',
      en: '401',
    },
    message: {
      cs: 'Pro přístup k těmto stránkám se prosím přihlašte.',
      en: 'Please sign in to access these pages.',
    },
    loginButton: {
      cs: 'Přihlásit se',
      en: 'Sign In',
    },
  },
  dashboard: {
    title: {
      cs: 'Naši školáci',
      en: 'Our Students',
    },
    logout: {
      cs: 'Odhlásit se',
      en: 'Logout',
    },
  },
  childrenTable: {
    name: {
      cs: 'Jméno',
      en: 'Name',
    },
    age: {
      cs: 'Věk',
      en: 'Age',
    },
    parent: {
      cs: 'Rodič',
      en: 'Parent',
    },
    contact: {
      cs: 'Kontakt na rodiče',
      en: 'Parent Contact',
    },
    notes: {
      cs: 'Poznámka',
      en: 'Notes',
    },
  },
};
