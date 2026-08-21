import { common } from './common';

export const login = {
  errors: {
    invalidCredentials: {
      cs: 'Nesprávný email nebo heslo',
      en: 'Invalid email or password',
    },
    serverError: {
      cs: 'Nepodařilo se připojit k serveru. Zkuste to prosím později.',
      en: 'Unable to connect to the server. Please try again later.',
    },
    forgotPasswordFailed: {
      cs: 'Nepodařilo se odeslat email',
      en: 'Failed to send email',
    },
    resetPasswordFailed: {
      cs: 'Nepodařilo se změnit heslo',
      en: 'Failed to reset password',
    },
    invalidResetToken: {
      cs: 'Neplatný nebo expirovaný odkaz pro obnovení hesla',
      en: 'Invalid or expired password reset link',
    },
  },
  success: {
    forgotPasswordEmailSent: {
      cs: 'Email byl odeslán',
      en: 'Email has been sent',
    },
    resetPasswordSuccess: {
      cs: 'Heslo bylo úspěšně změněno',
      en: 'Password has been reset successfully',
    },
  },
  validation: {
    emailRequired: common.templates.validation.required(
      { cs: 'Emailová adresa', en: 'Email address' },
      'fem'
    ),
    passwordRequired: {
      cs: 'Heslo je povinné',
      en: 'Password is required',
    },
    invalidEmail: common.templates.validation.invalidEmail,
    newPasswordLength: common.templates.validation.minLength(
      { cs: 'Nové heslo', en: 'New password' },
      8
    ),
    passwordUppercase: {
      cs: 'Heslo musí obsahovat alespoň jedno velké písmeno',
      en: 'Password must contain at least one uppercase letter',
    },
    passwordNumber: {
      cs: 'Heslo musí obsahovat alespoň jedno číslo',
      en: 'Password must contain at least one number',
    },
    passwordMatch: {
      cs: 'Hesla se musí shodovat',
      en: 'Passwords must match',
    },
  },
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
    forgotPassword: {
      cs: 'Zapomněli jste heslo?',
      en: 'Forgot your password?',
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
    backToLogin: {
      cs: 'Zpět na přihlášení',
      en: 'Back to Login',
    },
    checkEmail: {
      cs: 'Pokud je email registrován, poslali jsme vám instrukce pro obnovení hesla.',
      en: 'If the email is registered, we have sent you password reset instructions.',
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
  },
};
