export const auth = {
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
    loginButton: {
      cs: 'Přihlásit se',
      en: 'Sign In',
    },
    logout: {
      cs: 'Odhlásit se',
      en: 'Log Out',
    },
    serverError: {
      cs: 'Nepodařilo se připojit k serveru. Zkuste to prosím později.',
      en: 'Unable to connect to the server. Please try again later.',
    },
    validation: {
      emailRequired: {
        cs: 'Emailová adresa je povinná',
        en: 'Email address is required',
      },
      passwordRequired: {
        cs: 'Heslo je povinné',
        en: 'Password is required',
      },
      invalidEmail: {
        cs: 'Prosím zadejte platnou emailovou adresu',
        en: 'Please enter a valid email address',
      },
      invalidCredentials: {
        cs: 'Nesprávný email nebo heslo',
        en: 'Invalid email or password',
      },
    },
    forgotPassword: {
      cs: 'Zapomněli jste heslo?',
      en: 'Forgot your password?',
    },
  },
  signUp: {
    title: {
      cs: 'Registrace',
      en: 'Sign Up',
    },
    validation: {
      firstNameRequired: {
        cs: 'Jméno musí mít alespoň 2 znaky',
        en: 'First name must be at least 2 characters',
      },
      lastNameRequired: {
        cs: 'Příjmení musí mít alespoň 2 znaky',
        en: 'Last name must be at least 2 characters',
      },
      invalidEmail: {
        cs: 'Zadejte platnou emailovou adresu',
        en: 'Invalid email address',
      },
      passwordLength: {
        cs: 'Heslo musí mít alespoň 8 znaků',
        en: 'Password must be at least 8 characters',
      },
      passwordsMatch: {
        cs: 'Hesla se neshodují',
        en: "Passwords don't match",
      },
    },
  },
  forgotPassword: {
    title: {
      cs: 'Zapomenuté heslo',
      en: 'Forgot Password',
    },
    description: {
      cs: 'Zadejte svůj email a my vám pošleme odkaz pro obnovení hesla.',
      en: 'Enter your email and we will send you a password reset link.',
    },
    emailPlaceholder: {
      cs: 'Emailová adresa',
      en: 'Email Address',
    },
    submitButton: {
      cs: 'Odeslat odkaz pro obnovení',
      en: 'Send Reset Link',
    },
    loginLink: {
      cs: 'Zpět na přihlášení',
      en: 'Back to Login',
    },
    success: {
      title: {
        cs: 'Email byl odeslán',
        en: 'Email has been sent',
      },
      message: {
        cs: 'Pokud účet s tímto emailem existuje, poslali jsme vám odkaz pro obnovení hesla.',
        en: 'If an account exists with this email, we have sent you a password reset link.',
      },
    },
    error: {
      title: {
        cs: 'Chyba',
        en: 'Error',
      },
      message: {
        cs: 'Nepodařilo se odeslat email pro obnovení hesla. Zkuste to prosím později.',
        en: 'Failed to send password reset email. Please try again later.',
      },
      unknown: {
        cs: 'Nastala neznámá chyba',
        en: 'An unknown error occurred',
      },
      cs: 'Nepodařilo se odeslat email',
      en: 'Failed to send email',
    },
    checkEmail: {
      cs: 'Pokud je email registrován, poslali jsme vám instrukce pro obnovení hesla.',
      en: 'If the email is registered, we have sent you password reset instructions.',
    },
    validation: {
      emailRequired: {
        cs: 'Email je povinný',
        en: 'Email is required',
      },
      invalidEmail: {
        cs: 'Zadejte platnou emailovou adresu',
        en: 'Please enter a valid email address',
      },
    },
  },
  resetPassword: {
    title: {
      cs: 'Obnovení hesla',
      en: 'Reset Password',
    },
    passwordPlaceholder: {
      cs: 'Nové heslo',
      en: 'New Password',
    },
    confirmPasswordPlaceholder: {
      cs: 'Potvrďte nové heslo',
      en: 'Confirm New Password',
    },
    submitButton: {
      cs: 'Změnit heslo',
      en: 'Reset Password',
    },
    success: {
      cs: 'Heslo bylo úspěšně změněno',
      en: 'Password has been reset successfully',
    },
    error: {
      invalidToken: {
        cs: 'Neplatný nebo expirovaný odkaz pro obnovení hesla',
        en: 'Invalid or expired password reset link',
      },
      cs: 'Nepodařilo se změnit heslo',
      en: 'Failed to reset password',
    },
  },
};
