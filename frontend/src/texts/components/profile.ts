import { common, type Entity } from './common';

const profileEntity: Entity = {
  label: { cs: 'Profil', en: 'Profile' },
  accusative: 'profil',
  gender: 'masc',
};

const passwordEntity: Entity = {
  label: { cs: 'Heslo', en: 'Password' },
  accusative: 'heslo',
  gender: 'neut',
};

const notificationSettingsEntity: Entity = {
  label: { cs: 'Nastavení upozornění', en: 'Notification settings' },
  accusative: 'nastavení upozornění',
  gender: 'neut',
};

export const profile = {
  errors: {
    updateFailed: {
      title: common.templates.errors.failedToUpdate(profileEntity),
      description: {
        cs: 'Nastala chyba při aktualizaci profilu. Zkuste to prosím později.',
        en: 'An error occurred while updating the profile. Please try again later.',
      },
    },
    passwordChangeFailed: common.templates.errors.failedToChange(passwordEntity),
    incorrectCurrentPassword: {
      cs: 'Současné heslo není správné',
      en: 'Current password is incorrect',
    },
    notificationsUpdateFailed: common.templates.errors.failedToUpdate(notificationSettingsEntity),
  },
  success: {
    updated: common.templates.success.updated(profileEntity),
    passwordChanged: common.templates.success.changed(passwordEntity),
    notificationsUpdated: common.templates.success.updated(notificationSettingsEntity),
  },
  validation: {
    currentPasswordRequired: common.templates.validation.required(
      { cs: 'Současné heslo', en: 'Current password' },
      'neut',
    ),
    newPasswordRequired: common.templates.validation.required(
      { cs: 'Nové heslo', en: 'New password' },
      'neut',
    ),
    newPasswordLength: common.templates.validation.minLength(
      { cs: 'Nové heslo', en: 'New password' },
      8,
    ),
    confirmPasswordRequired: {
      cs: 'Potvrďte prosím nové heslo',
      en: 'Please confirm your new password',
    },
    passwordsDoNotMatch: {
      cs: 'Hesla se neshodují',
      en: "Passwords don't match",
    },
    firstNameRequired: common.templates.validation.required(
      { cs: 'Jméno', en: 'First name' },
      'neut',
    ),
    firstNameLength: common.templates.validation.minLength({ cs: 'Jméno', en: 'First name' }, 2),
    lastNameRequired: common.templates.validation.required(
      { cs: 'Příjmení', en: 'Last name' },
      'neut',
    ),
    lastNameLength: common.templates.validation.minLength(
      { cs: 'Příjmení', en: 'Last name' },
      2,
    ),
    emailRequired: common.templates.validation.required(
      { cs: 'Emailová adresa', en: 'Email address' },
      'fem',
    ),
    invalidEmail: common.templates.validation.invalidEmail,
    invalidPhone: {
      cs: 'Zadejte platné telefonní číslo',
      en: 'Please enter a valid phone number',
    },
  },
  title: {
    cs: 'Můj profil',
    en: 'My Profile',
  },
  menuItem: {
    cs: 'Můj profil',
    en: 'My Profile',
  },
  contactInfo: {
    cs: 'Kontaktní informace',
    en: 'Contact Info',
  },
  settingsMenu: {
    cs: 'Nastavení',
    en: 'Settings',
  },
  email: {
    cs: 'Emailová adresa',
    en: 'Email Address',
  },
  firstName: {
    cs: 'Jméno',
    en: 'First Name',
  },
  lastName: {
    cs: 'Příjmení',
    en: 'Last Name',
  },
  role: {
    cs: 'Role',
    en: 'Role',
  },
  phone: {
    cs: 'Telefon',
    en: 'Phone',
  },
  edit: {
    cs: 'Upravit profil',
    en: 'Edit Profile',
  },
  save: {
    cs: 'Uložit změny',
    en: 'Save Changes',
  },
  password: {
    cs: 'Heslo',
    en: 'Password',
  },
  changePassword: {
    cs: 'Změnit heslo',
    en: 'Change Password',
  },
  currentPassword: {
    cs: 'Současné heslo',
    en: 'Current Password',
  },
  newPassword: {
    cs: 'Nové heslo',
    en: 'New Password',
  },
  confirmNewPassword: {
    cs: 'Potvrďte nové heslo',
    en: 'Confirm New Password',
  },
  notifications: {
    title: {
      cs: 'Nastavení upozornění',
      en: 'Notification Settings',
    },
    messages: {
      cs: 'Emailová upozornění na nové zprávy',
      en: 'Email notifications for new messages',
    },
  },
};
